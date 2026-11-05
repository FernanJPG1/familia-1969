import { store } from '../../database/store';
import { whatsappService } from '../whatsapp/whatsapp.service';
import { eventBus } from '../../core/utils/events';
import { DateTimeUtils } from '../../core/utils/datetime.utils';
import { Appointment } from '../../core/types';

export class ReminderScheduler {
  private static timer: NodeJS.Timeout | null = null;
  private static isRunning = false;

  /**
   * Inicia el motor de recordatorios periódicos (ejecutado cada 30 segundos)
   */
  public static start(intervalMs: number = 30000): void {
    if (this.timer) return;
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
  public static stop(): void {
    this.isRunning = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /**
   * Revisa todas las citas activas y dispara recordatorios para las que comiencen en <= 20 minutos
   */
  public static checkAndSendReminders(): number {
    const now = Date.now();
    let sentCount = 0;

    for (const app of store.appointments) {
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
        if (sent) sentCount++;
      }
    }

    return sentCount;
  }

  /**
   * Envía el recordatorio interactivo de 20 minutos al cliente y notifica al barbero
   */
  public static send20MinuteReminder(app: Appointment): boolean {
    const reminderMsg = whatsappService.generateReminderMessage(app.id);
    if (!reminderMsg) return false;

    app.reminderSentAt = new Date();
    store.persist();

    const client = store.clients.find((c) => c.id === app.clientId);
    const service = store.findServiceById(app.serviceId);
    const startInfo = DateTimeUtils.extractDateAndTime(app.startTime);
    const timeFormatted = DateTimeUtils.format12h(startInfo.totalMinutes);

    // 1. Notificar en vivo al hilo de WhatsApp del simulador / Socket.IO
    eventBus.emit('whatsapp:reminder_sent', {
      appointmentId: app.id,
      clientPhone: client?.whatsappPhone,
      clientName: client?.name,
      serviceName: service?.name,
      time: timeFormatted,
      message: reminderMsg,
      timestamp: new Date().toISOString(),
    });

    // 2. Notificar al barbero en la pantalla web
    eventBus.emit('barber:notification', {
      type: 'reminder_sent',
      title: '⏰ Recordatorio 20m Enviado',
      message: `Se envió el recordatorio de 20 minutos a ${client?.name || 'Cliente'} para su cita de las ${timeFormatted}.`,
      appointmentId: app.id,
      clientName: client?.name,
      serviceName: service?.name,
      time: timeFormatted,
      timestamp: new Date().toISOString(),
    });

    eventBus.emit('dashboard:refresh');
    return true;
  }

  /**
   * Permite disparar manualmente el recordatorio para pruebas o desde la UI
   */
  public static send20MinuteReminderManual(appointmentId: string): boolean {
    const app = store.findAppointmentById(appointmentId);
    if (!app) return false;
    return this.send20MinuteReminder(app);
  }
}

export default ReminderScheduler;
