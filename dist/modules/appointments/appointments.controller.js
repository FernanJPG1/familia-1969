"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppointmentsController = void 0;
const appointments_service_1 = require("./appointments.service");
const reminder_scheduler_1 = require("./reminder.scheduler");
const events_1 = require("../../core/utils/events");
const store_1 = require("../../database/store");
const datetime_utils_1 = require("../../core/utils/datetime.utils");
class AppointmentsController {
    static async create(req, res) {
        try {
            const appointment = await appointments_service_1.AppointmentsService.createManual(req.body);
            const client = store_1.store.clients.find(c => c.id === appointment.clientId);
            const service = store_1.store.findServiceById(appointment.serviceId);
            const startInfo = datetime_utils_1.DateTimeUtils.extractDateAndTime(appointment.startTime);
            events_1.eventBus.emit('barber:notification', {
                type: 'new_booking',
                title: '🔔 ¡Nueva Cita Agendada!',
                message: `${client?.name || 'Cliente'} para ${service?.name || 'Corte'} a las ${datetime_utils_1.DateTimeUtils.format12h(startInfo.totalMinutes)}.`,
                appointmentId: appointment.id,
                clientName: client?.name,
                serviceName: service?.name,
                time: datetime_utils_1.DateTimeUtils.format12h(startInfo.totalMinutes),
                timestamp: new Date().toISOString(),
            });
            events_1.eventBus.emit('dashboard:refresh');
            res.status(201).json({ success: true, appointment });
        }
        catch (err) {
            console.error('Error creando cita:', err);
            res.status(err.statusCode || 500).json({ error: err.message });
        }
    }
    static updateStatus(req, res) {
        try {
            const { id } = req.params;
            const { status, notes } = req.body;
            const appointment = appointments_service_1.AppointmentsService.updateStatus(id, status, notes);
            const client = store_1.store.clients.find(c => c.id === appointment.clientId);
            const service = store_1.store.findServiceById(appointment.serviceId);
            const startInfo = datetime_utils_1.DateTimeUtils.extractDateAndTime(appointment.startTime);
            if (status === 'arrived') {
                events_1.eventBus.emit('barber:notification', {
                    type: 'client_arrived',
                    title: '🔔 ¡Cliente en Sala de Espera!',
                    message: `¡${client?.name || 'El cliente'} ha llegado a la barbería para su turno de las ${datetime_utils_1.DateTimeUtils.format12h(startInfo.totalMinutes)}!`,
                    appointmentId: appointment.id,
                    clientName: client?.name,
                    serviceName: service?.name,
                    time: datetime_utils_1.DateTimeUtils.format12h(startInfo.totalMinutes),
                    timestamp: new Date().toISOString(),
                });
            }
            events_1.eventBus.emit('appointment:updated', { appointment, status });
            events_1.eventBus.emit('dashboard:refresh');
            res.json({ success: true, appointment });
        }
        catch (err) {
            res.status(err.statusCode || 400).json({ error: err.message });
        }
    }
    static triggerReminder(req, res) {
        try {
            const { id } = req.params;
            const success = reminder_scheduler_1.ReminderScheduler.send20MinuteReminderManual(id);
            if (!success) {
                return res.status(400).json({ error: 'No se pudo generar recordatorio para esta cita' });
            }
            res.json({ success: true, message: 'Recordatorio T-20m enviado exitosamente' });
        }
        catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
}
exports.AppointmentsController = AppointmentsController;
exports.default = AppointmentsController;
