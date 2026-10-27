import { store } from '../../database/store';
import { AvailabilityEngine } from '../availability/availability.engine';
import { WhatsAppBookingContext, WhatsAppStep, Appointment, Client, Service } from '../../core/types';

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

  /**
   * Busca si el cliente ya es conocido y cuál fue su último corte
   */
  private getClientHistory(phone: string): { client?: Client; lastService?: Service } {
    const client = store.clients.find((c) => c.whatsappPhone === phone);
    if (!client) return {};

    const lastApp = store.appointments
      .filter((a) => a.clientId === client.id && a.status !== 'cancelled')
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())[0];

    const lastService = lastApp ? store.services.find((s) => s.id === lastApp.serviceId) : undefined;
    return { client, lastService };
  }

  /**
   * Procesa mensajes con Comprensión de Lenguaje Natural (NLU) y Atención Personalizada
   */
  public async handleIncomingMessage(
    tenantId: string,
    msg: WhatsAppIncomingMessage
  ): Promise<WhatsAppOutgoingMessage> {
    const session = this.getOrCreateSession(tenantId, msg.from);
    const tenant = store.tenants[0];
    const barber = store.barbers[0]; // Mateo Silva
    const rawText = (msg.text || '').trim();
    const text = rawText.toLowerCase();
    const actionId = msg.buttonId || msg.listId || '';

    const { client, lastService } = this.getClientHistory(msg.from);
    const clientFirstName = client ? client.name.split(' ')[0] : '';

    // ========================================================================
    // 1. MANEJO DE RECORDATORIOS ANTI-NO-SHOW (T-2h)
    // ========================================================================
    if (actionId.startsWith('CONFIRM_COMING_')) {
      const appId = actionId.replace('CONFIRM_COMING_', '');
      const app = store.appointments.find((a) => a.id === appId);
      if (app) {
        app.status = 'confirmed';
        app.notes = (app.notes ? app.notes + ' | ' : '') + 'Confirmado por WhatsApp [Voy en camino]';
        return {
          to: msg.from,
          type: 'text',
          body: `💈 ¡Excelente${clientFirstName ? ' ' + clientFirstName : ''}! Mateo Silva ya tiene tu sillón preparado. Nos vemos en un rato.`,
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
          body: `✅ Turno cancelado con éxito${clientFirstName ? ', ' + clientFirstName : ''}. Liberamos el espacio inmediatamente. ¡Agradecemos mucho tu aviso previo! Escríbeme cuando quieras reagendar.`,
        };
      }
    }

    // ========================================================================
    // 2. VERIFICACIÓN DE MODO BOT AUTOMÁTICO (Configurable por el Barbero)
    // ========================================================================
    if (!store.settings.autoBotEnabled && !actionId.startsWith('CONFIRM_COMING_') && !actionId.startsWith('CANCEL_APPOINTMENT_')) {
      return {
        to: msg.from,
        type: 'text',
        body: `💈 ¡Hola${clientFirstName ? ' ' + clientFirstName : ''}! En este momento la respuesta automática está pausada porque *${store.settings.barberName}* está atendiendo personalmente cada mensaje.\n\nRecibí tu consulta: "${rawText}". Te responderé en cuanto me desocupe del sillón.\n\n(Puedes consultar la dirección escribiendo *"donde"* o la lista de cortes con *"precios"*).`,
      };
    }

    // ========================================================================
    // 3. ATENCIÓN PERSONALIZADA / LENGUAJE NATURAL (FAQ & Consultas)
    // ========================================================================
    
    // A) Pregunta por Ubicación / Dirección
    if (text.includes('donde') || text.includes('ubicacion') || text.includes('direccion') || text.includes('queda') || text.includes('como llegar')) {
      return {
        to: msg.from,
        type: 'interactive_buttons',
        header: `📍 Ubicación de ${store.settings.shopName}`,
        body: `¡Hola${clientFirstName ? ' ' + clientFirstName : ''}! Estamos ubicados en *${store.settings.address}*.\n\n🚗 *Parqueadero:* ${store.settings.parkingInfo}.\n\n¿Deseas que te aparte un turno?`,
        buttons: [
          { id: 'INTENT_BOOK', title: '📅 Agendar Cita' },
          { id: 'INTENT_PRICES', title: '✂️ Ver Cortes & Precios' },
        ],
      };
    }

    // B) Pregunta por Precios o Catálogo
    if (text.includes('precio') || text.includes('cuanto vale') || text.includes('cuanto cuesta') || text.includes('costo') || text.includes('tarifas') || actionId === 'INTENT_PRICES') {
      const servicesList = store.services
        .filter((s) => s.isActive)
        .map((s) => `• *${s.name}*: $${s.price.toLocaleString('es-CO')} (${s.durationMinutes} min)`)
        .join('\n');

      return {
        to: msg.from,
        type: 'interactive_buttons',
        header: '💈 Catálogo de Cortes & Servicios',
        body: `Con gusto${clientFirstName ? ' ' + clientFirstName : ''}, estos son los cortes y rituales que realiza ${store.settings.barberName}:\n\n${servicesList}\n\n✨ *Recomendación del Barbero:* Nuestro servicio estrella es el *Combo VIP con Toalla Caliente* ($55,000).\n\n¿Cuál te llama la atención?`,
        buttons: [
          { id: 'INTENT_BOOK', title: '📅 Ver Horarios Libres' },
          { id: 'INTENT_TALK_HUMAN', title: '💬 Hablar con Mateo' },
        ],
      };
    }

    // C) Pregunta por Horarios de Atención
    if (text.includes('horario') || text.includes('a que hora') || text.includes('abren') || text.includes('cierran') || text.includes('atienden')) {
      const dayMap: Record<number, string> = { 1: 'Lunes', 2: 'Martes', 3: 'Miércoles', 4: 'Jueves', 5: 'Viernes', 6: 'Sábado', 7: 'Domingo' };
      const daysStr = store.settings.activeDays.map(d => dayMap[d] || '').filter(Boolean).join(', ');
      const lunchNotice = store.settings.lunchEnabled ? `\n🍽️ *Receso de almuerzo:* ${store.settings.lunchStartTime} - ${store.settings.lunchEndTime}` : '';

      return {
        to: msg.from,
        type: 'interactive_buttons',
        header: '🕒 Horarios de Atención',
        body: `Atendemos los días *${daysStr || 'Lunes a Sábado'}* de *${store.settings.workStartTime} a ${store.settings.workEndTime}*${lunchNotice}, exclusivamente con cita previa para garantizarte una atención sin esperas y con el tiempo que tu corte merece.\n\n¿Para qué día buscas tu espacio?`,
        buttons: [
          { id: 'INTENT_BOOK_TODAY', title: '⚡ Espacio para Hoy' },
          { id: 'INTENT_BOOK_TOMORROW', title: '📅 Para Mañana' },
        ],
      };
    }

    // D) Solicitud de Hablar con Mateo en Persona / Asistencia Humana
    if (text.includes('humano') || text.includes('persona') || text.includes('hablar con mateo') || actionId === 'INTENT_TALK_HUMAN') {
      return {
        to: msg.from,
        type: 'text',
        body: `📲 ¡Listo${clientFirstName ? ' ' + clientFirstName : ''}! Le acabo de notificar a ${store.settings.barberName} en su app móvil que deseas consultarle algo personalmente. Te responderá en cuanto termine con el sillón actual.\n\nSi mientras tanto deseas asegurar tu horario antes de que se agote la agenda, solo escribe *"agendar"* o *"menú"*.`,
      };
    }

    // E) Selección rápida del "Mismo de siempre" para clientes recurrentes
    if (actionId === 'REBOOK_SAME' && lastService) {
      session.contextData.serviceId = lastService.id;
      session.contextData.serviceName = lastService.name;
      session.contextData.serviceDuration = lastService.durationMinutes;
      session.contextData.servicePrice = lastService.price;
      session.contextData.clientName = client?.name;
      session.contextData.clientId = client?.id;
      session.currentStep = 'AWAITING_DATE';

      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);

      return {
        to: msg.from,
        type: 'interactive_buttons',
        header: `💈 ${lastService.name}`,
        body: `¡Excelente elección! Vamos con tu *${lastService.name}* ($${lastService.price.toLocaleString('es-CO')}).\n\n¿Para cuándo lo agendamos?`,
        buttons: [
          { id: `DATE_${today.toISOString().split('T')[0]}`, title: 'Hoy' },
          { id: `DATE_${tomorrow.toISOString().split('T')[0]}`, title: 'Mañana' },
          { id: 'INTENT_OTHER_DATE', title: '📅 Otro día' },
        ],
      };
    }

    // ========================================================================
    // 3. FLUJO CONVERSACIONAL DE RESERVA (FSM GUIADA + RECONOCIMIENTO)
    // ========================================================================
    
    // Reinicio o primer mensaje
    if (
      text === 'reiniciar' || 
      text === 'menu' || 
      actionId === 'INTENT_BOOK' ||
      (session.currentStep === 'IDLE' && actionId === '')
    ) {
      session.currentStep = 'AWAITING_SERVICE';
      const activeServices = store.services.filter((s) => s.isActive);

      // Saludo Personalizado si el cliente ya es conocido
      if (client && lastService) {
        return {
          to: msg.from,
          type: 'interactive_list',
          header: `💈 ${tenant.name}`,
          body: `¡Qué tal *${clientFirstName}*, mi hermano! Qué gusto saludarte de nuevo 💈.\n\nTu último corte fue *${lastService.name}*. ¿Agendamos ese mismo o prefieres elegir otro servicio del catálogo?`,
          footer: 'Toca abajo para elegir tu corte',
          sections: [
            {
              title: '⭐ Tu Corte Habitual',
              rows: [
                {
                  id: `SERVICE_${lastService.id}`,
                  title: `⭐ Mismo de siempre: ${lastService.name}`,
                  description: `${lastService.durationMinutes} min • $${lastService.price.toLocaleString('es-CO')}`,
                },
              ],
            },
            {
              title: 'Catálogo Completo',
              rows: activeServices.filter(s => s.id !== lastService.id).map((s) => ({
                id: `SERVICE_${s.id}`,
                title: s.name,
                description: `${s.durationMinutes} min • $${s.price.toLocaleString('es-CO')}`,
              })),
            },
          ],
        };
      }

      // Saludo para cliente nuevo
      return {
        to: msg.from,
        type: 'interactive_list',
        header: `💈 ${store.settings.shopName}`,
        body: store.settings.customGreeting || `¡Hola! Bienvenido a la atención personalizada de *${store.settings.barberName}* 💈.\n\nPara brindarte el mejor servicio, ¿qué tipo de corte deseas agendar hoy?`,
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

    switch (session.currentStep) {
      // PASO 1: Procesar Selección de Corte
      case 'AWAITING_SERVICE': {
        if (!actionId.startsWith('SERVICE_')) {
          // Si el usuario escribió texto natural en vez de presionar el botón (ej: "quiero corte clasico" o "barba")
          const matchedService = store.services.find(s => 
            s.isActive && (text.includes(s.name.toLowerCase()) || text.includes('corte') || text.includes('barba') || text.includes('fade'))
          ) || store.services[0];

          session.contextData.serviceId = matchedService.id;
          session.contextData.serviceName = matchedService.name;
          session.contextData.serviceDuration = matchedService.durationMinutes;
          session.contextData.servicePrice = matchedService.price;
        } else {
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
        }

        session.currentStep = 'AWAITING_DATE';

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
          body: `Perfecto${clientFirstName ? ' ' + clientFirstName : ''}, agendaremos: *${session.contextData.serviceName}* ($${session.contextData.servicePrice?.toLocaleString('es-CO')}).\n\n¿Para qué día deseas tu cita con *${barber.name}*?`,
          buttons: [
            { id: `DATE_${today.toISOString().split('T')[0]}`, title: `Hoy (${formatDateBtn(today)})` },
            { id: `DATE_${tomorrow.toISOString().split('T')[0]}`, title: `Mañana (${formatDateBtn(tomorrow)})` },
            { id: `DATE_${dayAfter.toISOString().split('T')[0]}`, title: `${formatDateBtn(dayAfter)}` },
          ],
        };
      }

      // PASO 2: Procesar Fecha -> Calcular Slots Disponibles con AvailabilityEngine
      case 'AWAITING_DATE': {
        let selectedDate = '';
        if (actionId.startsWith('DATE_')) {
          selectedDate = actionId.replace('DATE_', '');
        } else {
          // Búsqueda inteligente por texto ("hoy", "mañana")
          const today = new Date();
          if (text.includes('mañana')) {
            today.setDate(today.getDate() + 1);
            selectedDate = today.toISOString().split('T')[0];
          } else {
            selectedDate = today.toISOString().split('T')[0];
          }
        }

        session.contextData.date = selectedDate;
        const service = store.services.find((s) => s.id === session.contextData.serviceId) || store.services[0];

        // Ejecutar AvailabilityEngine para Mateo Silva
        const slots = this.availabilityEngine.calculateSlotsForBarber({
          barber,
          service,
          date: selectedDate,
          schedules: store.schedules,
          blocks: store.blocks,
          existingAppointments: store.appointments,
          slotBufferMinutes: store.settings.slotBufferMinutes,
        });

        const freeSlots = slots.filter((s) => s.available);

        if (freeSlots.length === 0) {
          return {
            to: msg.from,
            type: 'interactive_buttons',
            header: 'Sin Cupos Libres',
            body: `Lo sentimos${clientFirstName ? ' ' + clientFirstName : ''}, todos los turnos para el ${selectedDate} están ocupados.\n\n¿Deseas probar otra fecha?`,
            buttons: [
              { id: 'INTENT_BOOK', title: '📅 Probar otra fecha' },
              { id: 'INTENT_TALK_HUMAN', title: '💬 Hablar con Mateo' },
            ],
          };
        }

        session.currentStep = 'AWAITING_SLOT';
        const slotsToShow = freeSlots.slice(0, 10);

        return {
          to: msg.from,
          type: 'interactive_list',
          header: 'Horarios Disponibles',
          body: `📅 *Fecha:* ${selectedDate}\n✂️ *Corte:* ${service.name} (${service.durationMinutes} min)\n💈 *Barbero:* ${barber.name}\n\nSelecciona el horario que más te convenga:`,
          footer: 'Turnos calculados en tiempo real',
          sections: [
            {
              title: 'Horarios Libres de Mateo',
              rows: slotsToShow.map((s, idx) => ({
                id: `SLOT_${idx}_${encodeURIComponent(s.startTime)}_${encodeURIComponent(s.endTime)}`,
                title: s.formattedTime,
                description: `${service.durationMinutes} min (+10m preparación)`,
              })),
            },
          ],
        };
      }

      // PASO 3: Selección de Slot -> Reconocimiento de Nombre
      case 'AWAITING_SLOT': {
        if (!actionId.startsWith('SLOT_')) {
          return { to: msg.from, type: 'text', body: '⚠️ Por favor selecciona uno de los horarios libres de la lista tocando el botón.' };
        }

        const parts = actionId.split('_');
        const startISO = decodeURIComponent(parts[2]);
        const endISO = decodeURIComponent(parts[3]);

        session.contextData.slotStartTime = startISO;
        session.contextData.slotEndTime = endISO;

        // Si ya conocemos al cliente por su número, confirmamos directamente
        if (client) {
          session.contextData.clientName = client.name;
          session.contextData.clientId = client.id;
          return await this.confirmAndBookAppointment(tenantId, session, msg.from);
        }

        session.currentStep = 'AWAITING_NAME';
        return {
          to: msg.from,
          type: 'text',
          body: `🕒 Horario apartado temporalmente.\n\nPara personalizar tu cita con Mateo Silva, por favor *escribe tu Nombre y Apellido*:`,
        };
      }

      // PASO 4: Capturar Nombre del Cliente Nuevo
      case 'AWAITING_NAME': {
        const name = rawText;
        if (name.length < 3) {
          return {
            to: msg.from,
            type: 'text',
            body: '⚠️ Por favor ingresa tu nombre completo para anotarte en la agenda de Mateo:',
          };
        }

        const newClient: Client = {
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
          body: 'Sesión finalizada. Envía "Hola" para consultar horarios o agendar un nuevo corte con Mateo.',
        };
    }
  }

  /**
   * Reserva Atómica con Mutex y Mensaje de Confirmación Cálido
   */
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
          body: `⚠️ Lo sentimos, ese turno acaba de ser tomado por otro cliente. Por favor elige otro horario disponible.`,
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
        notes: `Agendado con atención personalizada para ${ctx.clientName}`,
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
        body: `🎉 *¡CITA AGENDADA CON ÉXITO!* 💈\n\n` +
          `👤 *Cliente:* ${ctx.clientName}\n` +
          `✂️ *Corte:* ${ctx.serviceName}\n` +
          `💈 *Barbero:* ${barber.name}\n` +
          `📅 *Fecha:* ${dateStr}\n` +
          `⏰ *Horario:* ${timeStr}\n` +
          `💵 *Valor:* $${(ctx.servicePrice || 0).toLocaleString('es-CO')}\n\n` +
          `📍 *Ubicación:* ${store.settings.address}\n\n` +
          `*Atención Personalizada:* ${store.settings.barberName} ya tiene tu espacio reservado. Te enviaremos un recordatorio interactivo 2 horas antes de tu turno. ¡Te esperamos para brindarte la mejor experiencia!`,
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

    const clientFirstName = client.name.split(' ')[0];

    return {
      to: client.whatsappPhone,
      type: 'interactive_buttons',
      header: '⏰ Recordatorio de Cita (En 2 Horas)',
      body: `¡Hola *${clientFirstName}*! Tu cita para *${service?.name || 'Corte'}* con *${barber.name}* es en 2 horas.\n\n¿Nos confirmas que vienes en camino?`,
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
