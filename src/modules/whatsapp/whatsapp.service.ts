import { store } from '../../database/store';
import { AvailabilityEngine } from '../availability/availability.engine';
import { WhatsAppBookingContext, WhatsAppStep, Appointment } from '../../core/types';

export interface WhatsAppIncomingMessage {
  from: string; // WhatsApp Phone (e.g. "573001234567")
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

  /**
   * Obtiene o crea la sesión conversacional de un usuario con TTL de 30 minutos
   */
  private getOrCreateSession(tenantId: string, phone: string) {
    let session = store.sessions.find(
      (s) => s.tenantId === tenantId && s.whatsappPhone === phone
    );

    const now = new Date();
    if (!session || new Date(session.expiresAt) < now) {
      // Sesión expirada o nueva
      session = {
        id: `sess-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        tenantId,
        whatsappPhone: phone,
        currentStep: 'IDLE',
        contextData: {},
        lastInteractionAt: now,
        expiresAt: new Date(now.getTime() + 30 * 60 * 1000), // 30 min TTL
      };
      // Reemplazar o insertar
      store.sessions = store.sessions.filter(
        (s) => !(s.tenantId === tenantId && s.whatsappPhone === phone)
      );
      store.sessions.push(session);
    } else {
      // Renovar TTL
      session.lastInteractionAt = now;
      session.expiresAt = new Date(now.getTime() + 30 * 60 * 1000);
    }

    return session;
  }

  /**
   * Procesa el mensaje entrante según la Máquina de Estados Finita (FSM)
   */
  public async handleIncomingMessage(
    tenantId: string,
    msg: WhatsAppIncomingMessage
  ): Promise<WhatsAppOutgoingMessage> {
    const session = this.getOrCreateSession(tenantId, msg.from);
    const tenant = store.tenants.find((t) => t.id === tenantId) || store.tenants[0];
    const incomingText = (msg.text || '').trim().toLowerCase();
    const actionId = msg.buttonId || msg.listId || '';

    // Manejo especial de respuestas a Recordatorio Anti-No-Show (T-2h)
    if (actionId.startsWith('CONFIRM_COMING_')) {
      const appId = actionId.replace('CONFIRM_COMING_', '');
      const app = store.appointments.find((a) => a.id === appId);
      if (app) {
        app.status = 'confirmed';
        app.notes = (app.notes ? app.notes + ' | ' : '') + 'Confirmado por WhatsApp [Voy en camino]';
        return {
          to: msg.from,
          type: 'text',
          body: `💈 ¡Excelente! Tu barbero ya tiene tu turno confirmado y el sillón listo. Te esperamos puntualmente.`,
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
          body: `✅ Tu cita ha sido cancelada con éxito y el turno fue liberado. Agradecemos mucho tu aviso anticipado. ¡Esperamos verte pronto!`,
        };
      }
    }

    // Si el usuario escribe "reiniciar", "menu" o "hola" en cualquier momento, reseteamos a IDLE
    if (incomingText === 'reiniciar' || incomingText === 'menu' || (session.currentStep === 'IDLE' && actionId === '')) {
      session.currentStep = 'IDLE';
      session.contextData = {};
    }

    switch (session.currentStep) {
      // PASO 1: Bienvenida y Selección de Servicio
      case 'IDLE': {
        session.currentStep = 'AWAITING_SERVICE';
        const activeServices = store.services.filter((s) => s.isActive && s.tenantId === tenantId);

        return {
          to: msg.from,
          type: 'interactive_list',
          header: `💈 ${tenant.name}`,
          body: `¡Hola! Bienvenido a nuestro sistema de reservas 24/7. ¿Qué servicio deseas agendar hoy?`,
          footer: 'Selecciona una opción de la lista',
          sections: [
            {
              title: 'Catálogo de Servicios',
              rows: activeServices.map((s) => ({
                id: `SERVICE_${s.id}`,
                title: s.name,
                description: `${s.durationMinutes} min • $${s.price.toLocaleString('es-CO')}`,
              })),
            },
          ],
        };
      }

      // PASO 2: Procesar Selección de Servicio -> Preguntar Barbero
      case 'AWAITING_SERVICE': {
        if (!actionId.startsWith('SERVICE_')) {
          return {
            to: msg.from,
            type: 'text',
            body: '⚠️ Por favor selecciona uno de los servicios disponibles en la lista interactiva.',
          };
        }

        const serviceId = actionId.replace('SERVICE_', '');
        const service = store.services.find((s) => s.id === serviceId);
        if (!service) {
          session.currentStep = 'IDLE';
          return { to: msg.from, type: 'text', body: 'Servicio no encontrado. Escribe "Hola" para reiniciar.' };
        }

        session.contextData.serviceId = service.id;
        session.contextData.serviceName = service.name;
        session.contextData.serviceDuration = service.durationMinutes;
        session.contextData.servicePrice = service.price;
        session.currentStep = 'AWAITING_BARBER';

        const activeBarbers = store.barbers.filter((b) => b.isActive && b.tenantId === tenantId);

        return {
          to: msg.from,
          type: 'interactive_list',
          header: 'Selecciona tu Barbero',
          body: `Has elegido: *${service.name}* ($${service.price.toLocaleString('es-CO')}).\n\n¿Con quién te gustaría atenderte?`,
          footer: 'Selecciona un barbero',
          sections: [
            {
              title: 'Equipo de Barberos',
              rows: [
                { id: 'BARBER_ANY', title: '⚡ Cualquier Barbero (Más Rápido)', description: 'Primer horario disponible' },
                ...activeBarbers.map((b) => ({
                  id: `BARBER_${b.id}`,
                  title: b.name,
                  description: 'Especialista en cortes y rituales',
                })),
              ],
            },
          ],
        };
      }

      // PASO 3: Procesar Selección de Barbero -> Preguntar Fecha
      case 'AWAITING_BARBER': {
        if (!actionId.startsWith('BARBER_')) {
          return {
            to: msg.from,
            type: 'text',
            body: '⚠️ Por favor selecciona un barbero de la lista.',
          };
        }

        const barberSelection = actionId.replace('BARBER_', '');
        if (barberSelection === 'ANY') {
          session.contextData.barberId = store.barbers[0].id;
          session.contextData.barberName = 'Primer Barbero Disponible';
        } else {
          const barber = store.barbers.find((b) => b.id === barberSelection);
          if (!barber) {
            return { to: msg.from, type: 'text', body: 'Barbero no válido. Por favor selecciona de la lista.' };
          }
          session.contextData.barberId = barber.id;
          session.contextData.barberName = barber.name;
        }

        session.currentStep = 'AWAITING_DATE';

        // Generar botones para Hoy, Mañana y Pasado Mañana
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
          body: `Barbero asignado: *${session.contextData.barberName}*.\n\n¿Para qué día deseas tu cita?`,
          buttons: [
            { id: `DATE_${today.toISOString().split('T')[0]}`, title: `Hoy (${formatDateBtn(today)})` },
            { id: `DATE_${tomorrow.toISOString().split('T')[0]}`, title: `Mañana (${formatDateBtn(tomorrow)})` },
            { id: `DATE_${dayAfter.toISOString().split('T')[0]}`, title: `${formatDateBtn(dayAfter)}` },
          ],
        };
      }

      // PASO 4: Procesar Fecha -> Calcular Slots Libres con AvailabilityEngine
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

        const barber = store.barbers.find((b) => b.id === session.contextData.barberId) || store.barbers[0];
        const service = store.services.find((s) => s.id === session.contextData.serviceId)!;

        // EJECUTAR EL AVAILABILITY ENGINE
        const slots = this.availabilityEngine.calculateSlotsForBarber({
          barber,
          service,
          date: selectedDate,
          schedules: store.schedules,
          blocks: store.blocks,
          existingAppointments: store.appointments,
          slotBufferMinutes: tenant.slotBufferMinutes,
        });

        // Filtrar únicamente los slots libres
        const freeSlots = slots.filter((s) => s.available);

        if (freeSlots.length === 0) {
          return {
            to: msg.from,
            type: 'interactive_buttons',
            header: 'Sin Cupos Disponibles',
            body: `Lo sentimos, no hay turnos disponibles para *${session.contextData.barberName}* el día ${selectedDate}.\n\n¿Deseas probar otra fecha?`,
            buttons: [
              { id: 'RETRY_DATE', title: '📅 Elegir otra fecha' },
              { id: 'MENU', title: '🔄 Volver al inicio' },
            ],
          };
        }

        session.currentStep = 'AWAITING_SLOT';

        // Mostrar hasta los primeros 10 slots disponibles
        const slotsToShow = freeSlots.slice(0, 10);

        return {
          to: msg.from,
          type: 'interactive_list',
          header: 'Horarios Disponibles',
          body: `📅 *Fecha:* ${selectedDate}\n✂️ *Servicio:* ${service.name} (${service.durationMinutes} min)\n💈 *Barbero:* ${barber.name}\n\nSelecciona la hora que prefieras:`,
          footer: 'Turnos calculados en tiempo real',
          sections: [
            {
              title: 'Horarios Libres',
              rows: slotsToShow.map((s, idx) => ({
                id: `SLOT_${idx}_${encodeURIComponent(s.startTime)}_${encodeURIComponent(s.endTime)}`,
                title: s.formattedTime,
                description: `Duración: ${service.durationMinutes}m (+10m buffer)`,
              })),
            },
          ],
        };
      }

      // PASO 5: Procesar Selección de Horario -> Pedir Nombre del Cliente (o confirmar si ya existe)
      case 'AWAITING_SLOT': {
        if (!actionId.startsWith('SLOT_')) {
          if (actionId === 'RETRY_DATE') {
            session.currentStep = 'AWAITING_DATE';
            return this.handleIncomingMessage(tenantId, { ...msg, buttonId: 'BARBER_' + session.contextData.barberId });
          }
          return { to: msg.from, type: 'text', body: '⚠️ Por favor selecciona uno de los horarios libres de la lista.' };
        }

        const parts = actionId.split('_');
        const startISO = decodeURIComponent(parts[2]);
        const endISO = decodeURIComponent(parts[3]);

        session.contextData.slotStartTime = startISO;
        session.contextData.slotEndTime = endISO;

        // Comprobar si el cliente ya está registrado en la base de datos por su número de teléfono
        const existingClient = store.clients.find(
          (c) => c.tenantId === tenantId && c.whatsappPhone === msg.from
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
          body: `🕒 Horario reservado temporalmente.\n\nPara finalizar, por favor *escribe tu Nombre y Apellido*:`,
        };
      }

      // PASO 6: Capturar Nombre del Cliente -> Confirmación Atómica
      case 'AWAITING_NAME': {
        const name = (msg.text || '').trim();
        if (name.length < 3) {
          return {
            to: msg.from,
            type: 'text',
            body: '⚠️ Por favor ingresa un nombre válido (mínimo 3 caracteres):',
          };
        }

        // Crear o actualizar cliente
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
          body: 'Sesión finalizada. Envía "Hola" para agendar una nueva cita.',
        };
    }
  }

  /**
   * Ejecución Atómica de Reserva con Mutex Lock para evitar Double-Booking
   */
  private async confirmAndBookAppointment(
    tenantId: string,
    session: any,
    phone: string
  ): Promise<WhatsAppOutgoingMessage> {
    const ctx: WhatsAppBookingContext = session.contextData;

    return await store.acquireLock(async () => {
      const barberId = ctx.barberId!;
      const startTime = new Date(ctx.slotStartTime!);
      const endTime = new Date(ctx.slotEndTime!);

      // Verificación atómica final contra colisiones de último segundo
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
          body: `⚠️ Lo sentimos mucho, ese turno acaba de ser reservado por otro cliente mientras confirmabas. Por favor elige otro horario.`,
        };
      }

      // Crear la cita oficialmente en la base de datos
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
        notes: `Agendado automáticamente vía WhatsApp Bot por ${ctx.clientName}`,
        reminderSentAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      store.appointments.push(newAppointment);

      // Resetear estado de sesión
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
          `✂️ *Servicio:* ${ctx.serviceName}\n` +
          `💈 *Barbero:* ${ctx.barberName}\n` +
          `📅 *Fecha:* ${dateStr}\n` +
          `⏰ *Horario:* ${timeStr}\n` +
          `💵 *Total:* $${(ctx.servicePrice || 0).toLocaleString('es-CO')}\n\n` +
          `📍 *Dirección:* Calle 85 # 14-25, Bogotá\n\n` +
          `*Recordatorio:* Te enviaremos un mensaje 2 horas antes de tu turno para que confirmes tu camino. ¡Te esperamos!`,
      };
    });
  }

  /**
   * Dispara el Recordatorio Anti-No-Show (T-2h) simulado para una cita
   */
  public generateReminderMessage(appointmentId: string): WhatsAppOutgoingMessage | null {
    const app = store.appointments.find((a) => a.id === appointmentId);
    if (!app || app.status === 'cancelled') return null;

    const client = store.clients.find((c) => c.id === app.clientId);
    const service = store.services.find((s) => s.id === app.serviceId);
    const barber = store.barbers.find((b) => b.id === app.barberId);

    if (!client) return null;

    app.reminderSentAt = new Date();

    return {
      to: client.whatsappPhone,
      type: 'interactive_buttons',
      header: '⏰ Recordatorio de Cita (En 2 Horas)',
      body: `Hola *${client.name}*, tu cita para *${service?.name || 'Corte'}* con *${barber?.name || 'tu barbero'}* es en 2 horas.\n\n¿Nos confirmas tu asistencia?`,
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
