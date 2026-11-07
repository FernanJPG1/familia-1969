import { store } from '../../database/store';
import { availabilityEngine } from './availability.engine';
import { DateTimeUtils } from '../../core/utils/datetime.utils';

export class AvailabilityController {
  public static getAvailability(req: any, res: any) {
    try {
      const { serviceId, date, barberId } = req.query as {
        serviceId?: string;
        date?: string;
        barberId?: string;
      };

      const targetDate = date || DateTimeUtils.getTodayDateString();
      const barber = (barberId ? store.barbers.find(b => b.id === barberId && b.isActive) : null) || store.getPrimaryBarber();

      if (!serviceId) {
        return res.status(400).json({ error: 'serviceId es requerido' });
      }

      const service = store.findServiceById(serviceId);
      if (!service) {
        return res.status(404).json({ error: 'Servicio no encontrado' });
      }

      const slots = availabilityEngine.calculateSlotsForBarber({
        barber,
        service,
        date: targetDate,
        schedules: store.schedules,
        blocks: store.blocks,
        existingAppointments: store.appointments,
        slotBufferMinutes: store.settings.slotBufferMinutes,
      });

      const freeSlots = slots.filter((s) => s.available);

      return res.json({
        date: targetDate,
        service,
        barber: { id: barber.id, name: barber.name, colorTag: barber.colorTag, phone: barber.phone },
        slots,
        freeSlotsCount: freeSlots.length,
        totalGeneratedSlots: slots.length,
      });
    } catch (err: any) {
      console.error('Error calculando disponibilidad:', err);
      return res.status(500).json({ error: err.message || 'Error interno al calcular disponibilidad' });
    }
  }
}

export default AvailabilityController;
