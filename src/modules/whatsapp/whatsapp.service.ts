import { store } from '../../database/store';
import { AvailabilityEngine } from '../availability/availability.engine';
import { WhatsAppBookingContext, WhatsAppStep, Appointment } from '../../core/types';

export interface WhatsAppIncomingMessage {
  from: string;
  type: 'text' | 'interactive_button' | 'interactive_list';
  text?: string;
  buttonId?: string;
  listId?: string;
}

export interface WhatsAppOutgoingMessage {
  to: string;
  type: 'text' | 'interactive_buttons' | 'interactive_list';
  header?: string;
  body: string;
  footer?: string;
  buttons?: { id: string; title: string }[];
  sections?: {
    title: string;
    rows: { id: string; title: string; description?: string }[];
  }[];
}

export class WhatsAppService {
  private availabilityEngine: AvailabilityEngine;

  constructor() {
    this.availabilityEngine = new AvailabilityEngine({ slotBufferMinutes: 10 });
  }

  private getOrCreateSession(tenantId: string, phone: string) {
    let session = store.sessions.find(
      (s) => s.tenantId === tenantId && s.whatsappPhone === phone
    );

    const now = new Date();
    if (!session || new Date(session.expiresAt) < now) {
      session = {
        id: `sess-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        tenantId,
        whatsappPhone: phone,
        currentStep: 'IDLE',
        contextData: {},
        lastInteractionAt: now,
        expiresAt: new Date(now.getTime() + 30 * 60 * 1000),
      };
      store.sessions = store.sessions.filter(
        (s) => !(s.tenantId === tenantId && s.whatsappPhone === phone)
      );
      store.sessions.push(session);
    } else {
      session.lastInteractionAt = now;
      session.expiresAt = new Date(now.getTime() + 30 * 60 * 1000);
    }

    return session;
  }

  public async handleIncomingMessage(
    tenantId: string,
    msg: WhatsAppIncomingMessage
  ): Promise<WhatsAppOutgoingMessage> {
    const session = this.getOrCreateSession(tenantId, msg.from);
    const tenant = store.tenants[0];
    const barber = store.barbers[0]; // 1 Solo Barbero
    const incomingText = (msg.text || '').trim().toLowerCase();
    const actionId = msg.buttonId || msg.listId || '';

    // Manejo de confirmación o cancelación de recordatorio Anti-No-Show (T-2h)
    if (actionId.startsWith('CONFIRM_COMING_')) {
      const appId = actionId.replace('CONFIRM_COMING_', '');
      const app = store.appointments.find((a) => a.id === appId);
      if (app) {
        app.status = 'confirmed';
        app.notes = (app.notes ? app.notes + ' | ' : '') + 'Confirmado por WhatsApp [Voy en camino]';
        return {
          to: msg.from,
          type: 'text',
          body: `💈 ¡Excelente! ${barber.name} ya tiene tu sillón listo y reservado. Te esperamos puntualmente.`,
        };
      }
    }

    if (actionId.startsWith('CANCEL_APPOINTMENT_')) {
      const appId = actionId.replace('CANCEL_APPOINTMENT_', '');
      const app = store.appointments.find((a) => a.id === appId);
      if (app) {
        app.status = 'cancelled';
        app.notes = (app.notes ? app.notes + ' | ' : '') + 'Cancelado oportunamente por WhatsApp';
        return {
          to: msg.from,
          type: 'text',
          body: `✅ Tu cita ha sido cancelada con éxito y el turno fue liberado. Agradecemos mucho tu aviso anticipado. ¡Esperamos verte pronto con ${barber.name}!`,
        };
      }
    }

    // Reinicio
    if (incomingText === 'reiniciar' || incomingText === 'menu' || (session.currentStep === 'IDLE' && actionId === '')) {
      session.currentStep = 'IDLE';
      session.contextData = {};
    }

    switch (session.currentStep) {
      // PASO 1: Bienvenida y Selección de Tipo de Corte (Catálogo Dinámico)
      case 'IDLE': {
        session.currentStep = 'AWAITING_SERVICE';
        const activeServices = store.services.filter((s) => s.isActive);

        return {
          to: msg.from,
          type: 'interactive_list',
          header: `💈 ${tenant.name}`,
          body: `¡Hola! Bienvenido al canal de reservas de *${barber.name}*. ¿Qué tipo de corte o servicio deseas agendar hoy?`,
          footer: 'Selecciona una opción del catálogo',
          sections: [
            {
              title: 'Cortes & Servicios Disponibles',
              rows: activeServices.map((s) => ({
                id: `SERVICE_${s.id}`,
                title: s.name,
                description: `${s.durationMinutes} min • $${s.price.toLocaleString('es-CO')}`,
              })),
            },
          ],
        };
      }

      // PASO 2: Procesar Selección de Corte -> Pasar Directo a Fecha (Al ser 1 solo barbero)
      case 'AWAITING_SERVICE': {
        if (!actionId.startsWith('SERVICE_')) {
          return {
            to: msg.from,
            type: 'text',
            body: '⚠️ Por favor selecciona uno de los tipos de corte de la lista interactiva.',
          };
        }

        const serviceId = actionId.replace('SERVICE_', '');
        const service = store.services.find((s) => s.id === serviceId);
        if (!service) {
          session.currentStep = 'IDLE';
          return { to: msg.from, type: 'text', body: 'Corte no encontrado. Escribe "Hola" para reiniciar.' };
        }

        session.contextData.serviceId = service.id;
        session.contextData.serviceName = service.name;
        session.contextData.serviceDuration = service.durationMinutes;
        session.contextData.servicePrice = service.price;
        // Asignación directa al único barbero
        session.contextData.barberId = barber.id;
        session.contextData.barberName = barber.name;

        session.currentStep = 'AWAITING_DATE';

        // Fechas rápidas: Hoy, Mañana, Pasado Mañana
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        const dayAfter = new Date(today);
        dayAfter.setDate(today.getDate() + 2);

        const formatDateBtn = (d: Date) => {
          const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
          return `${days[d.getDay()]} ${d.getDate()}/${d.getMonth() + 1}`;
        };

        return {
          to: msg.from,
          type: 'interactive_buttons',
          header: 'Elige el Día',
          body: `Has elegido: *${service.name}* ($${service.price.toLocaleString('es-CO')}).\n\n¿Para qué día deseas tu cita con *${barber.name}*?`,
          buttons: [
            { id: `DATE_${today.toISOString().split('T')[0]}`, title: `Hoy (${formatDateBtn(today)})` },
            { id: `DATE_${tomorrow.toISOString().split('T')[0]}`, title: `Mañana (${formatDateBtn(tomorrow)})` },
            { id: `DATE_${dayAfter.toISOString().split('T')[0]}`, title: `${formatDateBtn(dayAfter)}` },
          ],
        };
      }

      // PASO 3: Calcular Horarios Libres con AvailabilityEngine
      case 'AWAITING_DATE': {
        if (!actionId.startsWith('DATE_')) {
          return {
            to: msg.from,
            type: 'text',
            body: '⚠️ Por favor pulsa uno de los botones con la fecha deseada.',
          };
        }

        const selectedDate = actionId.replace('DATE_', '');
        session.contextData.date = selectedDate;

        const service = store.services.find((s) => s.id === session.contextData.serviceId)!;

        // Calcular turnos disponibles para el único barbero
        const slots = this.availabilityEngine.calculateSlotsForBarber({
          barber,
          service,
          date: selectedDate,
          schedules: store.schedules,
          blocks: store.blocks,
          existingAppointments: store.appointments,
          slotBufferMinutes: tenant.slotBufferMinutes,
        });

        const freeSlots = slots.filter((s) => s.available);

        if (freeSlots.length === 0) {
          return {
            to: msg.from,
            type: 'interactive_buttons',
            header: 'Sin Turnos Libres',
            body: `Lo sentimos, todos los turnos para el día ${selectedDate} están ocupados.\n\n¿Deseas probar otra fecha?`,
            buttons: [
              { id: 'RETRY_DATE', title: '📅 Probar otra fecha' },
              { id: 'MENU', title: '🔄 Volver al inicio' },
            ],
          };
        }

        session.currentStep = 'AWAITING_SLOT';
        const slotsToShow = freeSlots.slice(0, 10);

        return {
          to: msg.from,
          type: 'interactive_list',
          header: 'Horarios Disponibles',
          body: `📅 *Fecha:* ${selectedDate}\n✂️ *Corte:* ${service.name} (${service.durationMinutes} min)\n💈 *Barbero:* ${barber.name}\n\nSelecciona la hora que prefieras:`,
          footer: 'Turnos con 10m de buffer entre clientes',
          sections: [
            {
              title: 'Horarios Disponibles',
              rows: slotsToShow.map((s, idx) => ({
                id: `SLOT_${idx}_${encodeURIComponent(s.startTime)}_${encodeURIComponent(s.endTime)}`,
                title: s.formattedTime,
                description: `${service.durationMinutes} min (+10m limpieza)`,
              })),
            },
          ],
        };
      }

      // PASO 4: Selección de Slot -> Pedir Nombre
      case 'AWAITING_SLOT': {
        if (!actionId.startsWith('SLOT_')) {
          if (actionId === 'RETRY_DATE') {
            session.currentStep = 'AWAITING_DATE';
            return this.handleIncomingMessage(tenantId, { ...msg, buttonId: 'SERVICE_' + session.contextData.serviceId });
          }
          return { to: msg.from, type: 'text', body: '⚠️ Por favor selecciona uno de los horarios libres de la lista.' };
        }

        const parts = actionId.split('_');
        const startISO = decodeURIComponent(parts[2]);
        const endISO = decodeURIComponent(parts[3]);

        session.contextData.slotStartTime = startISO;
        session.contextData.slotEndTime = endISO;

        // Comprobar cliente existente
        const existingClient = store.clients.find(
          (c) => c.whatsappPhone === msg.from
        );

        if (existingClient) {
          session.contextData.clientName = existingClient.name;
          session.contextData.clientId = existingClient.id;
          return await this.confirmAndBookAppointment(tenantId, session, msg.from);
        }

        session.currentStep = 'AWAITING_NAME';
        return {
          to: msg.from,
          type: 'text',
          body: `🕒 Horario apartado temporalmente.\n\nPara finalizar tu reserva con ${barber.name}, por favor *escribe tu Nombre y Apellido*:`,
        };
      }

      // PASO 5: Capturar Nombre -> Confirmación Atómica
      case 'AWAITING_NAME': {
        const name = (msg.text || '').trim();
        if (name.length < 3) {
          return {
            to: msg.from,
            type: 'text',
            body: '⚠️ Por favor ingresa un nombre válido (mínimo 3 caracteres):',
          };
        }

        const newClient = {
          id: `client-${Date.now()}`,
          tenantId,
          name,
          whatsappPhone: msg.from,
          totalNoShows: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        store.clients.push(newClient);

        session.contextData.clientName = name;
        session.contextData.clientId = newClient.id;

        return await this.confirmAndBookAppointment(tenantId, session, msg.from);
      }

      default:
        session.currentStep = 'IDLE';
        return {
          to: msg.from,
          type: 'text',
          body: 'Sesión finalizada. Envía "Hola" para agendar un nuevo corte.',
        };
    }
  }

  private async confirmAndBookAppointment(
    tenantId: string,
    session: any,
    phone: string
  ): Promise<WhatsAppOutgoingMessage> {
    const ctx: WhatsAppBookingContext = session.contextData;
    const barber = store.barbers[0];

    return await store.acquireLock(async () => {
      const barberId = barber.id;
      const startTime = new Date(ctx.slotStartTime!);
      const endTime = new Date(ctx.slotEndTime!);

      const isStillFree = this.availabilityEngine.isSlotFree({
        barberId,
        startTime,
        endTime,
        existingAppointments: store.appointments,
        blocks: store.blocks,
      });

      if (!isStillFree) {
        session.currentStep = 'AWAITING_DATE';
        return {
          to: phone,
          type: 'text',
          body: `⚠️ Lo sentimos, ese turno acaba de ser tomado por otro cliente. Por favor elige otro horario.`,
        };
      }

      const newAppointment: Appointment = {
        id: `app-${Date.now()}`,
        tenantId,
        barberId,
        clientId: ctx.clientId!,
        serviceId: ctx.serviceId!,
        startTime,
        endTime,
        totalPrice: ctx.servicePrice || 35000,
        status: 'confirmed',
        notes: `Agendado automáticamente vía WhatsApp por ${ctx.clientName}`,
        reminderSentAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      store.appointments.push(newAppointment);

      session.currentStep = 'CONFIRMED';
      session.contextData = {};

      const formatTime = (d: Date) => {
        let h = d.getHours();
        const m = d.getMinutes();
        const period = h >= 12 ? 'PM' : 'AM';
        if (h > 12) h -= 12;
        if (h === 0) h = 12;
        return `${h}:${String(m).padStart(2, '0')} ${period}`;
      };

      const dateStr = startTime.toISOString().split('T')[0];
      const timeStr = `${formatTime(startTime)} - ${formatTime(endTime)}`;

      return {
        to: phone,
        type: 'text',
        body: `🎉 *¡CITA CONFIRMADA CON ÉXITO!* 💈\n\n` +
          `👤 *Cliente:* ${ctx.clientName}\n` +
          `✂️ *Corte:* ${ctx.serviceName}\n` +
          `💈 *Barbero:* ${barber.name}\n` +
          `📅 *Fecha:* ${dateStr}\n` +
          `⏰ *Horario:* ${timeStr}\n` +
          `💵 *Precio:* $${(ctx.servicePrice || 0).toLocaleString('es-CO')}\n\n` +
          `📍 *Ubicación:* Carrera 15 # 85-30, Bogotá\n\n` +
          `*Recordatorio Anti-Ausentismo:* Te enviaremos un mensaje interactivo 2 horas antes de tu turno para reconfirmar. ¡Te esperamos!`,
      };
    });
  }

  public generateReminderMessage(appointmentId: string): WhatsAppOutgoingMessage | null {
    const app = store.appointments.find((a) => a.id === appointmentId);
    if (!app || app.status === 'cancelled') return null;

    const client = store.clients.find((c) => c.id === app.clientId);
    const service = store.services.find((s) => s.id === app.serviceId);
    const barber = store.barbers[0];

    if (!client) return null;
    app.reminderSentAt = new Date();

    return {
      to: client.whatsappPhone,
      type: 'interactive_buttons',
      header: '⏰ Recordatorio de Cita (En 2 Horas)',
      body: `Hola *${client.name}*, tu cita para *${service?.name || 'Corte'}* con *${barber.name}* es en 2 horas.\n\n¿Confirmas tu asistencia?`,
      footer: 'Si cancelas ahora, liberarás el turno para otro cliente',
      buttons: [
        { id: `CONFIRM_COMING_${app.id}`, title: '✅ Voy en camino' },
        { id: `CANCEL_APPOINTMENT_${app.id}`, title: '❌ Cancelar turno' },
      ],
    };
  }
}

export const whatsappService = new WhatsAppService();
export default whatsappService;
