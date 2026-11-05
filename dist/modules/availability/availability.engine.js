"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.availabilityEngine = exports.AvailabilityEngine = void 0;
const datetime_utils_1 = require("../../core/utils/datetime.utils");
const constants_1 = require("../../config/constants");
class AvailabilityEngine {
    defaultBufferMinutes;
    constructor(options) {
        this.defaultBufferMinutes = options?.slotBufferMinutes ?? constants_1.APP_CONSTANTS.DEFAULT_SLOT_BUFFER_MINUTES;
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
    calculateSlotsForBarber(params) {
        const { barber, service, date, schedules, blocks, existingAppointments, slotBufferMinutes = this.defaultBufferMinutes } = params;
        // 1. Obtener día de la semana (1 = Lunes, 7 = Domingo)
        const dayOfWeek = datetime_utils_1.DateTimeUtils.getDayOfWeek(date);
        // Buscar la jornada activa para este día
        const daySchedule = schedules.find((s) => s.barberId === barber.id && s.dayOfWeek === dayOfWeek && s.isActive);
        if (!daySchedule) {
            // El barbero no atiende este día (ej: Domingo de descanso)
            return [];
        }
        const workStart = datetime_utils_1.DateTimeUtils.timeToMinutes(daySchedule.startTime);
        const workEnd = datetime_utils_1.DateTimeUtils.timeToMinutes(daySchedule.endTime);
        // Duración de la reserva y paso de intervalo
        const serviceDuration = service.durationMinutes;
        const intervalStep = serviceDuration + slotBufferMinutes;
        // 2. Bloqueos de agenda para esta fecha y barbero (Almuerzos, permisos)
        const activeBlocks = blocks
            .filter((b) => b.barberId === barber.id && b.date === date)
            .map((b) => ({
            start: datetime_utils_1.DateTimeUtils.timeToMinutes(b.startTime),
            end: datetime_utils_1.DateTimeUtils.timeToMinutes(b.endTime),
            reason: b.reason,
        }));
        // 3. Citas existentes activas para este barbero en esta fecha
        const activeAppointments = existingAppointments
            .filter((a) => {
            if (a.barberId !== barber.id || a.status === 'cancelled')
                return false;
            const aDate = datetime_utils_1.DateTimeUtils.extractDateAndTime(a.startTime).dateStr;
            return aDate === date;
        })
            .map((a) => {
            const startInfo = datetime_utils_1.DateTimeUtils.extractDateAndTime(a.startTime);
            const endInfo = datetime_utils_1.DateTimeUtils.extractDateAndTime(a.endTime);
            return {
                start: startInfo.totalMinutes,
                end: endInfo.totalMinutes,
                status: a.status
            };
        });
        // 4. Generación de Slots iterando a lo largo de la jornada
        const availableSlots = [];
        let currentCursor = workStart;
        while (currentCursor + serviceDuration <= workEnd) {
            const slotStartMin = currentCursor;
            const slotEndMin = currentCursor + serviceDuration;
            const slotStartTimeStr = datetime_utils_1.DateTimeUtils.minutesToTime(slotStartMin);
            const slotEndTimeStr = datetime_utils_1.DateTimeUtils.minutesToTime(slotEndMin);
            // A) Verificar colisión con schedule_blocks (Almuerzos)
            const collidingBlock = activeBlocks.find((block) => datetime_utils_1.DateTimeUtils.isOverlapping(slotStartMin, slotEndMin, block.start, block.end));
            // B) Verificar colisión con citas activas
            const collidingAppointment = activeAppointments.find((app) => datetime_utils_1.DateTimeUtils.isOverlapping(slotStartMin, slotEndMin, app.start, app.end));
            // C) Verificar si el horario ya pasó en el día de hoy
            const isPast = datetime_utils_1.DateTimeUtils.isPastDateTime(date, slotStartTimeStr);
            let isAvailable = true;
            let reason = undefined;
            if (isPast) {
                isAvailable = false;
                reason = 'Horario pasado';
            }
            else if (collidingBlock) {
                isAvailable = false;
                reason = collidingBlock.reason || 'Receso de almuerzo';
            }
            else if (collidingAppointment) {
                isAvailable = false;
                reason = 'Turno ya reservado';
            }
            const startDateTime = datetime_utils_1.DateTimeUtils.buildDateTime(date, slotStartTimeStr);
            const endDateTime = datetime_utils_1.DateTimeUtils.buildDateTime(date, slotEndTimeStr);
            availableSlots.push({
                startTime: startDateTime.toISOString(),
                endTime: endDateTime.toISOString(),
                formattedTime: datetime_utils_1.DateTimeUtils.formatTimeRange(slotStartMin, slotEndMin),
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
    isSlotFree(params) {
        const { barberId, startTime, endTime, existingAppointments, blocks } = params;
        const reqStartMs = startTime.getTime();
        const reqEndMs = endTime.getTime();
        // 1. Chequeo por milisegundos contra citas existentes no canceladas
        const hasAppointmentCollision = existingAppointments.some((a) => {
            if (a.barberId !== barberId || a.status === 'cancelled')
                return false;
            const aStartMs = new Date(a.startTime).getTime();
            const aEndMs = new Date(a.endTime).getTime();
            return reqStartMs < aEndMs && reqEndMs > aStartMs;
        });
        if (hasAppointmentCollision)
            return false;
        // 2. Chequeo contra schedule_blocks (Almuerzos o descansos)
        const { dateStr, totalMinutes: startMins } = datetime_utils_1.DateTimeUtils.extractDateAndTime(startTime);
        const { totalMinutes: endMins } = datetime_utils_1.DateTimeUtils.extractDateAndTime(endTime);
        const hasBlockCollision = blocks.some((b) => {
            if (b.barberId !== barberId || b.date !== dateStr)
                return false;
            const bStart = datetime_utils_1.DateTimeUtils.timeToMinutes(b.startTime);
            const bEnd = datetime_utils_1.DateTimeUtils.timeToMinutes(b.endTime);
            return datetime_utils_1.DateTimeUtils.isOverlapping(startMins, endMins, bStart, bEnd);
        });
        return !hasBlockCollision;
    }
}
exports.AvailabilityEngine = AvailabilityEngine;
exports.availabilityEngine = new AvailabilityEngine();
exports.default = exports.availabilityEngine;
