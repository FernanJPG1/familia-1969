import { 
  Barber, 
  BarberSchedule, 
  ScheduleBlock, 
  Appointment, 
  Service, 
  TimeSlot 
} from '../../core/types';

export interface AvailabilityEngineOptions {
  slotBufferMinutes?: number; // Default 10 min
}

export class AvailabilityEngine {
  private defaultBufferMinutes: number;

  constructor(options?: AvailabilityEngineOptions) {
    this.defaultBufferMinutes = options?.slotBufferMinutes ?? 10;
  }

  /**
   * Helper para convertir 'HH:mm' a minutos desde la medianoche
   */
  private timeToMinutes(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Helper para convertir minutos desde la medianoche a 'HH:mm'
   */
  private minutesToTime(totalMinutes: number): string {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }

  /**
   * Formatea un rango de hora en formato legible para el cliente (ej: "10:00 AM - 10:40 AM")
   */
  private formatTimeRange(startMinutes: number, endMinutes: number): string {
    const formatSingle = (mins: number) => {
      let h = Math.floor(mins / 60);
      const m = mins % 60;
      const period = h >= 12 ? 'PM' : 'AM';
      if (h > 12) h -= 12;
      if (h === 0) h = 12;
      return `${h}:${String(m).padStart(2, '0')} ${period}`;
    };

    return `${formatSingle(startMinutes)} - ${formatSingle(endMinutes)}`;
  }

  /**
   * Calcula los slots disponibles para un barbero específico en una fecha determinada.
   * Reglas de negocio:
   * 1. Toma la jornada laboral del barbero para el día de la semana (1=Lun ... 7=Dom).
   * 2. Divide la jornada en intervalos según: service.durationMinutes + buffer (10 min).
   * 3. Excluye turnos existentes cuyo status != 'cancelled'.
   * 4. Excluye schedule_blocks (almuerzos, permisos, etc.) para esa fecha.
   */
  public calculateSlotsForBarber(params: {
    barber: Barber;
    service: Service;
    date: string; // YYYY-MM-DD
    schedules: BarberSchedule[];
    blocks: ScheduleBlock[];
    existingAppointments: Appointment[];
    slotBufferMinutes?: number;
  }): TimeSlot[] {
    const { 
      barber, 
      service, 
      date, 
      schedules, 
      blocks, 
      existingAppointments, 
      slotBufferMinutes = this.defaultBufferMinutes 
    } = params;

    // 1. Obtener día de la semana (1 = Lunes, 7 = Domingo)
    // Usamos split para evitar desajustes por zona horaria de Date()
    const [year, month, day] = date.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);
    let jsDay = dateObj.getDay(); // 0 = Domingo, 1 = Lunes ... 6 = Sábado
    const dayOfWeek = jsDay === 0 ? 7 : jsDay;

    // Buscar la jornada activa para este día
    const daySchedule = schedules.find(
      (s) => s.barberId === barber.id && s.dayOfWeek === dayOfWeek && s.isActive
    );

    if (!daySchedule) {
      // El barbero no trabaja este día
      return [];
    }

    const workStart = this.timeToMinutes(daySchedule.startTime);
    const workEnd = this.timeToMinutes(daySchedule.endTime);

    // Duración de la reserva y paso del slot
    const serviceDuration = service.durationMinutes;
    const intervalStep = serviceDuration + slotBufferMinutes;

    // 2. Filtrar bloqueos de agenda para esta fecha y barbero
    const activeBlocks = blocks
      .filter((b) => b.barberId === barber.id && b.date === date)
      .map((b) => ({
        start: this.timeToMinutes(b.startTime),
        end: this.timeToMinutes(b.endTime),
        reason: b.reason,
      }));

    // 3. Filtrar citas existentes no canceladas para este barbero en esta fecha
    const activeAppointments = existingAppointments
      .filter((a) => {
        if (a.barberId !== barber.id || a.status === 'cancelled') return false;
        const appDate = new Date(a.startTime).toISOString().split('T')[0];
        return appDate === date;
      })
      .map((a) => {
        const start = new Date(a.startTime);
        const end = new Date(a.endTime);
        const startMins = start.getHours() * 60 + start.getMinutes();
        const endMins = end.getHours() * 60 + end.getMinutes();
        return { start: startMins, end: endMins, status: a.status };
      });

    // 4. Generación de Slots iterando a lo largo de la jornada
    const availableSlots: TimeSlot[] = [];
    let currentCursor = workStart;

    while (currentCursor + serviceDuration <= workEnd) {
      const slotStartMin = currentCursor;
      const slotEndMin = currentCursor + serviceDuration;

      // Verificar si hay colisión con schedule_blocks
      const collidesWithBlock = activeBlocks.some((block) => {
        // Solapamiento: el inicio del slot es menor que el fin del bloqueo Y el fin del slot es mayor que el inicio del bloqueo
        return slotStartMin < block.end && slotEndMin > block.start;
      });

      // Verificar si hay colisión con citas existentes (considerando el buffer de servicio)
      const collidesWithAppointment = activeAppointments.some((app) => {
        // Un turno existente también ocupa su tiempo
        return slotStartMin < app.end && slotEndMin > app.start;
      });

      const isAvailable = !collidesWithBlock && !collidesWithAppointment;

      // Construir ISO Strings para la fecha y hora calculada
      const startTimeISO = new Date(
        Date.UTC(year, month - 1, day, Math.floor(slotStartMin / 60), slotStartMin % 60)
      ).toISOString();

      const endTimeISO = new Date(
        Date.UTC(year, month - 1, day, Math.floor(slotEndMin / 60), slotEndMin % 60)
      ).toISOString();

      availableSlots.push({
        startTime: startTimeISO,
        endTime: endTimeISO,
        formattedTime: this.formatTimeRange(slotStartMin, slotEndMin),
        available: isAvailable,
        barberId: barber.id,
        barberName: barber.name,
      });

      // Avanzar el cursor por la duración del servicio + buffer
      currentCursor += intervalStep;
    }

    return availableSlots;
  }

  /**
   * Verificación atómica antes de confirmar la reserva para evitar condiciones de carrera (Double-Booking).
   * Valida si un intervalo específico sigue 100% libre.
   */
  public isSlotFree(params: {
    barberId: string;
    startTime: Date;
    endTime: Date;
    existingAppointments: Appointment[];
    blocks: ScheduleBlock[];
  }): boolean {
    const { barberId, startTime, endTime, existingAppointments, blocks } = params;
    const reqStart = startTime.getTime();
    const reqEnd = endTime.getTime();

    // 1. Chequeo contra citas existentes no canceladas
    const hasAppointmentCollision = existingAppointments.some((a) => {
      if (a.barberId !== barberId || a.status === 'cancelled') return false;
      const aStart = new Date(a.startTime).getTime();
      const aEnd = new Date(a.endTime).getTime();
      return reqStart < aEnd && reqEnd > aStart;
    });

    if (hasAppointmentCollision) return false;

    // 2. Chequeo contra schedule_blocks
    const dateStr = startTime.toISOString().split('T')[0];
    const startMins = startTime.getHours() * 60 + startTime.getMinutes();
    const endMins = endTime.getHours() * 60 + endTime.getMinutes();

    const hasBlockCollision = blocks.some((b) => {
      if (b.barberId !== barberId || b.date !== dateStr) return false;
      const bStart = this.timeToMinutes(b.startTime);
      const bEnd = this.timeToMinutes(b.endTime);
      return startMins < bEnd && endMins > bStart;
    });

    return !hasBlockCollision;
  }
}

export default AvailabilityEngine;
