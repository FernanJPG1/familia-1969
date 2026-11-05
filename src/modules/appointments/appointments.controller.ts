import { AppointmentsService } from './appointments.service';
import { whatsappService } from '../whatsapp/whatsapp.service';
import { ReminderScheduler } from './reminder.scheduler';
import { eventBus } from '../../core/utils/events';
import { store } from '../../database/store';
import { DateTimeUtils } from '../../core/utils/datetime.utils';

export class AppointmentsController {
  public static async create(req: any, res: any) {
    try {
      const appointment = await AppointmentsService.createManual(req.body);

      const client = store.clients.find(c => c.id === appointment.clientId);
      const service = store.findServiceById(appointment.serviceId);
      const startInfo = DateTimeUtils.extractDateAndTime(appointment.startTime);

      eventBus.emit('barber:notification', {
        type: 'new_booking',
        title: '🔔 ¡Nueva Cita Agendada!',
        message: `${client?.name || 'Cliente'} para ${service?.name || 'Corte'} a las ${DateTimeUtils.format12h(startInfo.totalMinutes)}.`,
        appointmentId: appointment.id,
        clientName: client?.name,
        serviceName: service?.name,
        time: DateTimeUtils.format12h(startInfo.totalMinutes),
        timestamp: new Date().toISOString(),
      });

      eventBus.emit('dashboard:refresh');
      res.status(201).json({ success: true, appointment });
    } catch (err: any) {
      console.error('Error creando cita:', err);
      res.status(err.statusCode || 500).json({ error: err.message });
    }
  }

  public static updateStatus(req: any, res: any) {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;
      const appointment = AppointmentsService.updateStatus(id, status, notes);

      const client = store.clients.find(c => c.id === appointment.clientId);
      const service = store.findServiceById(appointment.serviceId);
      const startInfo = DateTimeUtils.extractDateAndTime(appointment.startTime);

      if (status === 'arrived') {
        eventBus.emit('barber:notification', {
          type: 'client_arrived',
          title: '🔔 ¡Cliente en Sala de Espera!',
          message: `¡${client?.name || 'El cliente'} ha llegado a la barbería para su turno de las ${DateTimeUtils.format12h(startInfo.totalMinutes)}!`,
          appointmentId: appointment.id,
          clientName: client?.name,
          serviceName: service?.name,
          time: DateTimeUtils.format12h(startInfo.totalMinutes),
          timestamp: new Date().toISOString(),
        });
      }

      eventBus.emit('appointment:updated', { appointment, status });
      eventBus.emit('dashboard:refresh');

      res.json({ success: true, appointment });
    } catch (err: any) {
      res.status(err.statusCode || 400).json({ error: err.message });
    }
  }

  public static triggerReminder(req: any, res: any) {
    try {
      const { id } = req.params;
      const success = ReminderScheduler.send20MinuteReminderManual(id);

      if (!success) {
        return res.status(400).json({ error: 'No se pudo generar recordatorio para esta cita' });
      }

      res.json({ success: true, message: 'Recordatorio T-20m enviado exitosamente' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
}

export default AppointmentsController;
