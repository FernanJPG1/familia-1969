import { 
  Barber, 
  BarberSchedule, 
  ScheduleBlock, 
  Appointment, 
  Service, 
  TimeSlot 
} from '../../core/types';
import { DateTimeUtils } from '../../core/utils/datetime.utils';
import { APP_CONSTANTS } from '../../config/constants';

export interface AvailabilityEngineOptions {
  slotBufferMinutes?: number;
}

export class AvailabilityEngine {
  private defaultBufferMinutes: number;

  constructor(options?: AvailabilityEngineOptions) {
    this.defaultBufferMinutes = options?.slotBufferMinutes ?? APP_CONSTANTS.DEFAULT_SLOT_BUFFER_MINUTES;
  }

  /**
   * Calcula con precisión los slots de atención disponibles para un barbero en una fecha dada.
   * Reglas de negocio:
   * 1. Determina la jornada laboral activa para el día de la semana (1=Lun ... 7=Dom).
   * 2. Segmenta la jornada en pasos de: service.durationMinutes + buffer (ej: 40 + 10 = 50 min).
   * 3. Excluye turnos activos cuya condición sea distinta de 'cancelled'.
   * 4. Excluye descansos y almuerzos (schedule_blocks).
   * 5. Si la fecha es 'hoy', invalida turnos cuya hora ya haya transcurrido.
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
    const dayOfWeek = DateTimeUtils.getDayOfWeek(date);

    // Buscar la jornada activa para este día
    const daySchedule = schedules.find(
      (s) => s.barberId === barber.id && s.dayOfWeek === dayOfWeek && s.isActive
    );

    if (!daySchedule) {
      // El barbero no atiende este día (ej: Domingo de descanso)
      return [];
    }

    const workStart = DateTimeUtils.timeToMinutes(daySchedule.startTime);
    const workEnd = DateTimeUtils.timeToMinutes(daySchedule.endTime);

    // Duración de la reserva y paso de intervalo
    const serviceDuration = service.durationMinutes;
    const intervalStep = serviceDuration + slotBufferMinutes;

    // 2. Bloqueos de agenda para esta fecha y barbero (Almuerzos, permisos)
    const activeBlocks = blocks
      .filter((b) => b.barberId === barber.id && b.date === date)
      .map((b) => ({
        start: DateTimeUtils.timeToMinutes(b.startTime),
        end: DateTimeUtils.timeToMinutes(b.endTime),
        reason: b.reason,
      }));

    // 3. Citas existentes activas para este barbero en esta fecha
    const activeAppointments = existingAppointments
      .filter((a) => {
        if (a.barberId !== barber.id || a.status === 'cancelled') return false;
        const aDate = DateTimeUtils.extractDateAndTime(a.startTime).dateStr;
        return aDate === date;
      })
      .map((a) => {
        const startInfo = DateTimeUtils.extractDateAndTime(a.startTime);
        const endInfo = DateTimeUtils.extractDateAndTime(a.endTime);
        return { 
          start: startInfo.totalMinutes, 
          end: endInfo.totalMinutes, 
          status: a.status 
        };
      });

    // 4. Generación de Slots iterando a lo largo de la jornada
    const availableSlots: TimeSlot[] = [];
    let currentCursor = workStart;

    while (currentCursor + serviceDuration <= workEnd) {
      const slotStartMin = currentCursor;
      const slotEndMin = currentCursor + serviceDuration;
      const slotStartTimeStr = DateTimeUtils.minutesToTime(slotStartMin);
      const slotEndTimeStr = DateTimeUtils.minutesToTime(slotEndMin);

      // A) Verificar colisión con schedule_blocks (Almuerzos)
      const collidingBlock = activeBlocks.find((block) => 
        DateTimeUtils.isOverlapping(slotStartMin, slotEndMin, block.start, block.end)
      );

      // B) Verificar colisión con citas activas
      const collidingAppointment = activeAppointments.find((app) => 
        DateTimeUtils.isOverlapping(slotStartMin, slotEndMin, app.start, app.end)
      );

      // C) Verificar si el horario ya pasó en el día de hoy
      const isPast = DateTimeUtils.isPastDateTime(date, slotStartTimeStr);

      let isAvailable = true;
      let reason: string | undefined = undefined;

      if (isPast) {
        isAvailable = false;
        reason = 'Horario pasado';
      } else if (collidingBlock) {
        isAvailable = false;
        reason = collidingBlock.reason || 'Receso de almuerzo';
      } else if (collidingAppointment) {
        isAvailable = false;
        reason = 'Turno ya reservado';
      }

      const startDateTime = DateTimeUtils.buildDateTime(date, slotStartTimeStr);
      const endDateTime = DateTimeUtils.buildDateTime(date, slotEndTimeStr);

      availableSlots.push({
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        formattedTime: DateTimeUtils.formatTimeRange(slotStartMin, slotEndMin),
        available: isAvailable,
        barberId: barber.id,
        barberName: barber.name,
        reason,
      });

      // Avanzar cursor por la duración del servicio + buffer de preparación
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
    const reqStartMs = startTime.getTime();
    const reqEndMs = endTime.getTime();

    // 1. Chequeo por milisegundos contra citas existentes no canceladas
    const hasAppointmentCollision = existingAppointments.some((a) => {
      if (a.barberId !== barberId || a.status === 'cancelled') return false;
      const aStartMs = new Date(a.startTime).getTime();
      const aEndMs = new Date(a.endTime).getTime();
      return reqStartMs < aEndMs && reqEndMs > aStartMs;
    });

    if (hasAppointmentCollision) return false;

    // 2. Chequeo contra schedule_blocks (Almuerzos o descansos)
    const { dateStr, totalMinutes: startMins } = DateTimeUtils.extractDateAndTime(startTime);
    const { totalMinutes: endMins } = DateTimeUtils.extractDateAndTime(endTime);

    const hasBlockCollision = blocks.some((b) => {
      if (b.barberId !== barberId || b.date !== dateStr) return false;
      const bStart = DateTimeUtils.timeToMinutes(b.startTime);
      const bEnd = DateTimeUtils.timeToMinutes(b.endTime);
      return DateTimeUtils.isOverlapping(startMins, endMins, bStart, bEnd);
    });

    return !hasBlockCollision;
  }
}

export const availabilityEngine = new AvailabilityEngine();
export default availabilityEngine;
