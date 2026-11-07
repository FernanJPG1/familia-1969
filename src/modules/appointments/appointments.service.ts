import { store } from '../../database/store';
import { availabilityEngine } from '../availability/availability.engine';
import { Appointment, Client } from '../../core/types';
import { BadRequestError, NotFoundError, ConflictError } from '../../core/errors/app-error';

export class AppointmentsService {
  public static async createManual(params: {
    serviceId: string;
    clientName: string;
    clientPhone?: string;
    startTimeISO: string;
    notes?: string;
    barberId?: string;
  }): Promise<Appointment> {
    const { serviceId, clientName, clientPhone, startTimeISO, notes, barberId } = params;
    const barber = (barberId ? store.barbers.find(b => b.id === barberId && b.isActive) : null) || store.getPrimaryBarber();
    const tenant = store.getPrimaryTenant();

    if (!serviceId || !clientName || !startTimeISO) {
      throw new BadRequestError('Faltan campos obligatorios (serviceId, clientName, startTimeISO)');
    }

    const service = store.findServiceById(serviceId);
    if (!service) {
      throw new NotFoundError('Servicio no encontrado');
    }

    const startTime = new Date(startTimeISO);
    const endTime = new Date(startTime.getTime() + service.durationMinutes * 60000);

    return await store.acquireLock(async () => {
      const isFree = availabilityEngine.isSlotFree({
        barberId: barber.id,
        startTime,
        endTime,
        existingAppointments: store.appointments,
        blocks: store.blocks,
      });

      if (!isFree) {
        throw new ConflictError('Ese horario ya no se encuentra libre para agendar con el barbero seleccionado');
      }

      const phone = clientPhone?.trim() || '573000000000';
      let client = store.findClientByPhone(phone);

      if (!client) {
        client = {
          id: `client-${Date.now()}`,
          tenantId: tenant.id,
          name: clientName.trim(),
          whatsappPhone: phone,
          totalNoShows: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        store.clients.push(client);
      }

      const newAppointment: Appointment = {
        id: `app-manual-${Date.now()}`,
        tenantId: tenant.id,
        barberId: barber.id,
        clientId: client.id,
        serviceId: service.id,
        startTime,
        endTime,
        totalPrice: service.price,
        status: 'confirmed',
        notes: notes || `Agendado con barbero: ${barber.name}`,
        reminderSentAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      store.appointments.push(newAppointment);
      store.persist();
      return newAppointment;
    });
  }

  public static updateStatus(id: string, status: string, notes?: string): Appointment {
    const appItem = store.findAppointmentById(id);
    if (!appItem) {
      throw new NotFoundError('Cita no encontrada');
    }

    const validStatuses = ['pending', 'confirmed', 'arrived', 'completed', 'cancelled', 'no_show'];
    if (!validStatuses.includes(status)) {
      throw new BadRequestError(`Estado no válido. Estados permitidos: ${validStatuses.join(', ')}`);
    }

    appItem.status = status as any;
    if (notes !== undefined) appItem.notes = notes;
    appItem.updatedAt = new Date();

    if (status === 'no_show') {
      const client = store.clients.find((c) => c.id === appItem.clientId);
      if (client) {
        client.totalNoShows += 1;
      }
    }

    store.persist();
    return appItem;
  }
}

export default AppointmentsService;
