"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReminderScheduler = void 0;
const store_1 = require("../../database/store");
const whatsapp_service_1 = require("../whatsapp/whatsapp.service");
const events_1 = require("../../core/utils/events");
const datetime_utils_1 = require("../../core/utils/datetime.utils");
class ReminderScheduler {
    static timer = null;
    static isRunning = false;
    /**
     * Inicia el motor de recordatorios periódicos (ejecutado cada 30 segundos)
     */
    static start(intervalMs = 30000) {
        if (this.timer)
            return;
        this.isRunning = true;
        console.log('⏰ Sistema Automático de Recordatorios 20m antes del turno: ACTIVO');
        // Primera verificación al iniciar
        this.checkAndSendReminders();
        this.timer = setInterval(() => {
            if (this.isRunning) {
                this.checkAndSendReminders();
            }
        }, intervalMs);
    }
    /**
     * Detiene el motor de recordatorios
     */
    static stop() {
        this.isRunning = false;
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }
    /**
     * Revisa todas las citas activas y dispara recordatorios para las que comiencen en <= 20 minutos
     */
    static checkAndSendReminders() {
        const now = Date.now();
        let sentCount = 0;
        for (const app of store_1.store.appointments) {
            // Omitir citas que no requieren recordatorio
            if (app.status === 'cancelled' || app.status === 'completed' || app.status === 'no_show') {
                continue;
            }
            // Si ya se envió recordatorio para este turno, omitir
            if (app.reminderSentAt) {
                continue;
            }
            const startMs = new Date(app.startTime).getTime();
            const diffMinutes = (startMs - now) / 60000;
            // Disparar en la ventana: 20 minutos antes del turno (hasta 0 min)
            if (diffMinutes <= 20 && diffMinutes > -5) {
                const sent = this.send20MinuteReminder(app);
                if (sent)
                    sentCount++;
            }
        }
        return sentCount;
    }
    /**
     * Envía el recordatorio interactivo de 20 minutos al cliente y notifica al barbero
     */
    static send20MinuteReminder(app) {
        const reminderMsg = whatsapp_service_1.whatsappService.generateReminderMessage(app.id);
        if (!reminderMsg)
            return false;
        app.reminderSentAt = new Date();
        store_1.store.persist();
        const client = store_1.store.clients.find((c) => c.id === app.clientId);
        const service = store_1.store.findServiceById(app.serviceId);
        const startInfo = datetime_utils_1.DateTimeUtils.extractDateAndTime(app.startTime);
        const timeFormatted = datetime_utils_1.DateTimeUtils.format12h(startInfo.totalMinutes);
        // 1. Notificar en vivo al hilo de WhatsApp del simulador / Socket.IO
        events_1.eventBus.emit('whatsapp:reminder_sent', {
            appointmentId: app.id,
            clientPhone: client?.whatsappPhone,
            clientName: client?.name,
            serviceName: service?.name,
            time: timeFormatted,
            message: reminderMsg,
            timestamp: new Date().toISOString(),
        });
        // 2. Notificar al barbero en la pantalla web
        events_1.eventBus.emit('barber:notification', {
            type: 'reminder_sent',
            title: '⏰ Recordatorio 20m Enviado',
            message: `Se envió el recordatorio de 20 minutos a ${client?.name || 'Cliente'} para su cita de las ${timeFormatted}.`,
            appointmentId: app.id,
            clientName: client?.name,
            serviceName: service?.name,
            time: timeFormatted,
            timestamp: new Date().toISOString(),
        });
        events_1.eventBus.emit('dashboard:refresh');
        return true;
    }
    /**
     * Permite disparar manualmente el recordatorio para pruebas o desde la UI
     */
    static send20MinuteReminderManual(appointmentId) {
        const app = store_1.store.findAppointmentById(appointmentId);
        if (!app)
            return false;
        return this.send20MinuteReminder(app);
    }
}
exports.ReminderScheduler = ReminderScheduler;
exports.default = ReminderScheduler;
