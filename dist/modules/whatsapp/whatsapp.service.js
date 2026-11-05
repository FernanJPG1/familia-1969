"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.whatsappService = exports.WhatsAppService = void 0;
const store_1 = require("../../database/store");
const availability_engine_1 = require("../availability/availability.engine");
const datetime_utils_1 = require("../../core/utils/datetime.utils");
const whatsapp_nlu_1 = require("./whatsapp.nlu");
const events_1 = require("../../core/utils/events");
class WhatsAppService {
    /**
     * Genera filas interactivas para WhatsApp con los próximos días laborales (omitiendo días de descanso)
     */
    generateUpcomingActiveDateRows(daysCount = 7) {
        const rows = [];
        const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        const activeDays = store_1.store.settings.activeDays;
        let checkDate = new Date();
        // Empezar desde pasado mañana
        checkDate.setDate(checkDate.getDate() + 2);
        let found = 0;
        let guard = 0;
        while (found < daysCount && guard < 35) {
            guard++;
            const year = checkDate.getFullYear();
            const month = String(checkDate.getMonth() + 1).padStart(2, '0');
            const day = String(checkDate.getDate()).padStart(2, '0');
            const dateStr = `${year}-${month}-${day}`;
            const jsDay = checkDate.getDay();
            const customDayOfWeek = jsDay === 0 ? 7 : jsDay;
            if (activeDays.includes(customDayOfWeek)) {
                const dayName = dayNames[jsDay];
                const monthName = monthNames[checkDate.getMonth()];
                rows.push({
                    id: `DATE_${dateStr}`,
                    title: `📅 ${dayName}, ${checkDate.getDate()} de ${monthName}`,
                    description: `Turnos disponibles con ${store_1.store.settings.barberName}`,
                });
                found++;
            }
            checkDate.setDate(checkDate.getDate() + 1);
        }
        return rows;
    }
    /**
     * Genera la respuesta interactiva con calendario desplegable y lista de fechas activas
     */
    generateCalendarPickerResponse(to, clientFirstName, session) {
        session.currentStep = 'AWAITING_DATE';
        const barber = store_1.store.getPrimaryBarber();
        const service = store_1.store.findServiceById(session.contextData.serviceId || '') || store_1.store.services[0];
        const todayStr = datetime_utils_1.DateTimeUtils.getTodayDateString();
        const dayNames = { 1: 'Lunes', 2: 'Martes', 3: 'Miércoles', 4: 'Jueves', 5: 'Viernes', 6: 'Sábado', 7: 'Domingo' };
        const allDays = [1, 2, 3, 4, 5, 6, 7];
        const restDays = allDays.filter(d => !store_1.store.settings.activeDays.includes(d));
        const restDayNames = restDays.map(d => dayNames[d] + 's').join(', ') || 'Domingos';
        const upcomingRows = this.generateUpcomingActiveDateRows(7);
        return {
            to,
            type: 'interactive_list',
            header: '📅 Calendario de Reservas',
            body: `¡Con gusto${clientFirstName ? ', ' + clientFirstName : ''}! Elige el día que prefieras en el calendario interactivo a continuación o selecciona una de las fechas disponibles para tu *${service.name}* con *${barber.name}*:\n\n⚠️ *Jornada de descanso semanal:* Los *${restDayNames}* el estudio permanece cerrado por descanso de *${barber.name}* 💈.`,
            footer: 'Toca una fecha para ver horarios disponibles',
            calendarPicker: {
                minDate: todayStr,
                maxDate: datetime_utils_1.DateTimeUtils.addDaysToDate(todayStr, 30),
                activeDays: store_1.store.settings.activeDays,
                restDays,
                restDayNames,
                barberName: barber.name,
            },
            sections: [
                {
                    title: 'Próximas Fechas de Atención',
                    rows: upcomingRows,
                },
            ],
        };
    }
    getTimeOfDayGreeting() {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 12)
            return '¡Buenos días! ☀️';
        if (hour >= 12 && hour < 18)
            return '¡Buenas tardes! ☕';
        return '¡Buenas noches! 🌙';
    }
    /**
     * Obtiene la sesión activa o crea una nueva con expiración a 30 minutos
     */
    getOrCreateSession(tenantId, phone) {
        let session = store_1.store.sessions.find((s) => s.tenantId === tenantId && s.whatsappPhone === phone);
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
            store_1.store.sessions = store_1.store.sessions.filter((s) => !(s.tenantId === tenantId && s.whatsappPhone === phone));
            store_1.store.sessions.push(session);
        }
        else {
            session.lastInteractionAt = now;
            session.expiresAt = new Date(now.getTime() + 30 * 60 * 1000);
        }
        return session;
    }
    /**
     * Recupera el historial del cliente y su último servicio contratado
     */
    getClientHistory(phone) {
        const client = store_1.store.findClientByPhone(phone);
        if (!client)
            return {};
        const lastApp = store_1.store.appointments
            .filter((a) => a.clientId === client.id && a.status !== 'cancelled')
            .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())[0];
        const lastService = lastApp ? store_1.store.findServiceById(lastApp.serviceId) : undefined;
        return { client, lastService };
    }
    /**
     * Procesa mensajes entrantes con NLU, gestión de estado conversacional y reserva atómica
     */
    async handleIncomingMessage(tenantId, msg) {
        const session = this.getOrCreateSession(tenantId, msg.from);
        const tenant = store_1.store.getPrimaryTenant();
        const barber = store_1.store.getPrimaryBarber();
        const rawText = (msg.text || '').trim();
        const actionId = msg.buttonId || msg.listId || '';
        const { client, lastService } = this.getClientHistory(msg.from);
        const clientFirstName = client ? client.name.split(' ')[0] : '';
        const timeGreeting = this.getTimeOfDayGreeting();
        // ========================================================================
        // 1. MANEJO DE ACCIONES DE RECORDATORIO (ANTI-NO-SHOW) Y LLEGADA DE CLIENTES
        // ========================================================================
        if (actionId.startsWith('CONFIRM_ARRIVED_') || actionId.startsWith('CLIENT_ARRIVED_')) {
            const appId = actionId.replace('CONFIRM_ARRIVED_', '').replace('CLIENT_ARRIVED_', '');
            const app = store_1.store.findAppointmentById(appId);
            if (app) {
                app.status = 'arrived';
                app.notes = (app.notes ? app.notes + ' | ' : '') + 'Cliente presente en local [Llegó / Sala de Espera]';
                const service = store_1.store.findServiceById(app.serviceId);
                const startInfo = datetime_utils_1.DateTimeUtils.extractDateAndTime(app.startTime);
                // Notificar al barbero en tiempo real vía Socket.IO
                events_1.eventBus.emit('barber:notification', {
                    type: 'client_arrived',
                    title: '🔔 ¡Cliente en Sala de Espera!',
                    message: `¡${client?.name || 'Un cliente'} ha llegado a la barbería para su turno de las ${datetime_utils_1.DateTimeUtils.format12h(startInfo.totalMinutes)}!`,
                    appointmentId: app.id,
                    clientName: client?.name,
                    serviceName: service?.name,
                    time: datetime_utils_1.DateTimeUtils.format12h(startInfo.totalMinutes),
                    phone: msg.from,
                    timestamp: new Date().toISOString(),
                });
                events_1.eventBus.emit('appointment:updated', { appointment: app, status: 'arrived' });
                events_1.eventBus.emit('dashboard:refresh');
                return {
                    to: msg.from,
                    type: 'text',
                    body: `💈 ¡Hola${clientFirstName ? ' ' + clientFirstName : ''}! Bienvenido a ${store_1.store.settings.shopName}. Ya le notifiqué a *${barber.name}* en su pantalla que estás en la sala de espera. En breves minutos te llamará al sillón. ¡Ponte cómodo!`,
                };
            }
        }
        if (actionId.startsWith('CONFIRM_COMING_')) {
            const appId = actionId.replace('CONFIRM_COMING_', '');
            const app = store_1.store.findAppointmentById(appId);
            if (app) {
                app.status = 'confirmed';
                app.notes = (app.notes ? app.notes + ' | ' : '') + 'Confirmó por WhatsApp [Voy en camino]';
                const service = store_1.store.findServiceById(app.serviceId);
                const startInfo = datetime_utils_1.DateTimeUtils.extractDateAndTime(app.startTime);
                events_1.eventBus.emit('barber:notification', {
                    type: 'client_coming',
                    title: '🚗 Cliente en Camino',
                    message: `${client?.name || 'El cliente'} confirmó que viene en camino para su turno de las ${datetime_utils_1.DateTimeUtils.format12h(startInfo.totalMinutes)}.`,
                    appointmentId: app.id,
                    clientName: client?.name,
                    serviceName: service?.name,
                    time: datetime_utils_1.DateTimeUtils.format12h(startInfo.totalMinutes),
                    phone: msg.from,
                    timestamp: new Date().toISOString(),
                });
                events_1.eventBus.emit('appointment:updated', { appointment: app, status: 'confirmed' });
                events_1.eventBus.emit('dashboard:refresh');
                return {
                    to: msg.from,
                    type: 'text',
                    body: `💈 ¡Excelente${clientFirstName ? ' ' + clientFirstName : ''}! ${barber.name} ya tiene tu sillón preparado. Nos vemos en un rato.`,
                };
            }
        }
        if (actionId.startsWith('CANCEL_APPOINTMENT_')) {
            const appId = actionId.replace('CANCEL_APPOINTMENT_', '');
            const app = store_1.store.findAppointmentById(appId);
            if (app) {
                app.status = 'cancelled';
                app.notes = (app.notes ? app.notes + ' | ' : '') + 'Cancelado oportunamente por WhatsApp';
                const service = store_1.store.findServiceById(app.serviceId);
                const startInfo = datetime_utils_1.DateTimeUtils.extractDateAndTime(app.startTime);
                events_1.eventBus.emit('barber:notification', {
                    type: 'booking_cancelled',
                    title: '⚠️ Cita Cancelada Oportunamente',
                    message: `${client?.name || 'El cliente'} canceló su turno de las ${datetime_utils_1.DateTimeUtils.format12h(startInfo.totalMinutes)}. El espacio quedó libre.`,
                    appointmentId: app.id,
                    clientName: client?.name,
                    timestamp: new Date().toISOString(),
                });
                events_1.eventBus.emit('appointment:updated', { appointment: app, status: 'cancelled' });
                events_1.eventBus.emit('dashboard:refresh');
                return {
                    to: msg.from,
                    type: 'text',
                    body: `✅ Turno cancelado con éxito${clientFirstName ? ', ' + clientFirstName : ''}. Liberamos el espacio inmediatamente. ¡Agradecemos mucho tu aviso previo! Escríbeme cuando quieras reagendar.`,
                };
            }
        }
        // ========================================================================
        // 2. VERIFICACIÓN DE MODO BOT AUTOMÁTICO
        // ========================================================================
        if (!store_1.store.settings.autoBotEnabled && !actionId.startsWith('CONFIRM_COMING_') && !actionId.startsWith('CONFIRM_ARRIVED_') && !actionId.startsWith('CANCEL_APPOINTMENT_')) {
            return {
                to: msg.from,
                type: 'text',
                body: `💈 ¡Hola${clientFirstName ? ' ' + clientFirstName : ''}! En este momento la respuesta automática está pausada porque *${store_1.store.settings.barberName}* está atendiendo personalmente cada mensaje.\n\nRecibí tu consulta: "${rawText}". Te responderé en cuanto me desocupe del sillón.\n\n(Puedes consultar la dirección escribiendo *"donde"* o la lista de cortes con *"precios"*).`,
            };
        }
        // ========================================================================
        // 3. ANÁLISIS DE INTENCIÓN NLU
        // ========================================================================
        const intent = whatsapp_nlu_1.WhatsAppNLU.detectIntent(rawText, actionId);
        // 0) Llegada del cliente al local ("Ya llegué", "estoy acá", "estoy en la sala")
        if (intent === 'CLIENT_ARRIVED') {
            const todayStr = datetime_utils_1.DateTimeUtils.getTodayDateString();
            const app = store_1.store.appointments.find((a) => {
                if (a.status === 'cancelled' || a.status === 'completed')
                    return false;
                const c = store_1.store.clients.find((cli) => cli.id === a.clientId);
                if (!c || c.whatsappPhone !== msg.from)
                    return false;
                const aDate = datetime_utils_1.DateTimeUtils.extractDateAndTime(a.startTime).dateStr;
                return aDate === todayStr;
            });
            if (app) {
                app.status = 'arrived';
                app.notes = (app.notes ? app.notes + ' | ' : '') + 'Cliente presente en local [Avisó por WhatsApp: Ya llegué]';
                const service = store_1.store.findServiceById(app.serviceId);
                const startInfo = datetime_utils_1.DateTimeUtils.extractDateAndTime(app.startTime);
                // Notificar al barbero en tiempo real vía Socket.IO
                events_1.eventBus.emit('barber:notification', {
                    type: 'client_arrived',
                    title: '🔔 ¡Cliente en Sala de Espera!',
                    message: `¡${client?.name || 'Un cliente'} avisó por WhatsApp que ya llegó para su turno de las ${datetime_utils_1.DateTimeUtils.format12h(startInfo.totalMinutes)}!`,
                    appointmentId: app.id,
                    clientName: client?.name,
                    serviceName: service?.name,
                    time: datetime_utils_1.DateTimeUtils.format12h(startInfo.totalMinutes),
                    phone: msg.from,
                    timestamp: new Date().toISOString(),
                });
                events_1.eventBus.emit('appointment:updated', { appointment: app, status: 'arrived' });
                events_1.eventBus.emit('dashboard:refresh');
                return {
                    to: msg.from,
                    type: 'text',
                    body: `💈 ¡Hola${clientFirstName ? ' ' + clientFirstName : ''}! Bienvenido a ${store_1.store.settings.shopName}. Ya le notifiqué a *${barber.name}* en su pantalla que acabas de llegar y estás en la sala de espera. En breves minutos pasas al sillón. ¡Ponte cómodo!`,
                };
            }
            else {
                return {
                    to: msg.from,
                    type: 'text',
                    body: `💈 ¡Hola${clientFirstName ? ' ' + clientFirstName : ''}! Bienvenido a ${store_1.store.settings.shopName}. No encontramos una cita activa registrada para hoy con este número. Si deseas agendar un corte, escribe *"agendar"* o *"precios"*.`,
                };
            }
        }
        // A0) Agradecimiento y Cortesía
        if (intent === 'GRATITUDE') {
            return {
                to: msg.from,
                type: 'interactive_buttons',
                header: `💈 ${store_1.store.settings.shopName}`,
                body: `${timeGreeting} ¡Con el mayor de los gustos${clientFirstName ? ', ' + clientFirstName : ''}! Es un verdadero placer atenderte. En ${store_1.store.settings.shopName} trabajamos para brindarte una atención impecable.\n\n¿Deseas revisar tu próxima cita o ver los cortes de *${barber.name}*?`,
                buttons: [
                    { id: 'INTENT_BOOK', title: '📅 Agendar Cita' },
                    { id: 'INTENT_PRICES', title: '✂️ Ver Cortes & Precios' },
                ],
            };
        }
        // A1) Afirmación / Cortesía conversacional
        if (intent === 'AFFIRMATION' && session.currentStep === 'IDLE') {
            return {
                to: msg.from,
                type: 'interactive_buttons',
                header: `💈 ${store_1.store.settings.shopName}`,
                body: `¡Excelente${clientFirstName ? ' ' + clientFirstName : ''}! Quedo a tu total disposición. Cuando desees asegurar tu espacio con *${barber.name}*, solo dímelo o toca una opción:`,
                buttons: [
                    { id: 'INTENT_BOOK', title: '📅 Agendar Cita' },
                    { id: 'INTENT_PRICES', title: '✂️ Ver Cortes & Precios' },
                ],
            };
        }
        // A) Ubicación / Dirección
        if (intent === 'LOCATION') {
            return {
                to: msg.from,
                type: 'interactive_buttons',
                header: `📍 Ubicación de ${store_1.store.settings.shopName}`,
                body: `¡Hola${clientFirstName ? ' ' + clientFirstName : ''}! Estamos ubicados en *${store_1.store.settings.address}*.\n\n🚗 *Parqueadero:* ${store_1.store.settings.parkingInfo}.\n\n¿Deseas apartar tu turno?`,
                buttons: [
                    { id: 'INTENT_BOOK', title: '📅 Agendar Cita' },
                    { id: 'INTENT_PRICES', title: '✂️ Ver Cortes & Precios' },
                ],
            };
        }
        // B) Precios / Catálogo
        if (intent === 'PRICES') {
            const activeServices = store_1.store.services.filter((s) => s.isActive);
            const servicesList = activeServices
                .map((s) => {
                const badgeText = s.badge ? ` [${s.badge}]` : '';
                const descText = s.description ? `\n  _${s.description}_` : '';
                return `• *${s.name}*${badgeText}: $${s.price.toLocaleString('es-CO')} (${s.durationMinutes} min)${descText}`;
            })
                .join('\n\n');
            return {
                to: msg.from,
                type: 'interactive_buttons',
                header: '💈 Catálogo de Cortes & Servicios',
                body: `Con gusto${clientFirstName ? ' ' + clientFirstName : ''}, estos son los cortes y rituales de ${store_1.store.settings.barberName}:\n\n${servicesList}\n\n¿Deseas revisar horarios disponibles para apartar tu turno?`,
                buttons: [
                    { id: 'INTENT_BOOK', title: '📅 Ver Horarios Libres' },
                    { id: 'INTENT_TALK_HUMAN', title: '💬 Hablar con Mateo' },
                ],
            };
        }
        // C) Horarios de Atención
        if (intent === 'SCHEDULE') {
            const dayMap = { 1: 'Lunes', 2: 'Martes', 3: 'Miércoles', 4: 'Jueves', 5: 'Viernes', 6: 'Sábado', 7: 'Domingo' };
            const daysStr = store_1.store.settings.activeDays.map(d => dayMap[d] || '').filter(Boolean).join(', ');
            const lunchNotice = store_1.store.settings.lunchEnabled
                ? `\n🍽️ *Receso de almuerzo:* ${datetime_utils_1.DateTimeUtils.format12h(store_1.store.settings.lunchStartTime)} a ${datetime_utils_1.DateTimeUtils.format12h(store_1.store.settings.lunchEndTime)}`
                : '';
            return {
                to: msg.from,
                type: 'interactive_buttons',
                header: '🕒 Horarios de Atención',
                body: `Atendemos de *${daysStr || 'Lunes a Sábado'}* de *${datetime_utils_1.DateTimeUtils.format12h(store_1.store.settings.workStartTime)} a ${datetime_utils_1.DateTimeUtils.format12h(store_1.store.settings.workEndTime)}*${lunchNotice}, exclusivamente con reserva previa para garantizarte una atención sin esperas.\n\n¿Para qué día buscas tu espacio?`,
                buttons: [
                    { id: 'INTENT_BOOK_TODAY', title: '⚡ Espacio para Hoy' },
                    { id: 'INTENT_BOOK_TOMORROW', title: '📅 Para Mañana' },
                ],
            };
        }
        // D) Asistencia Humana / Hablar con Mateo
        if (intent === 'TALK_HUMAN') {
            return {
                to: msg.from,
                type: 'text',
                body: `📲 ¡Listo${clientFirstName ? ' ' + clientFirstName : ''}! Le acabo de notificar a ${store_1.store.settings.barberName} que deseas consultarle algo personalmente. Te responderá en cuanto termine con el cliente actual en sillón.\n\nSi mientras tanto deseas asegurar tu horario antes de que se agote la agenda, solo escribe *"agendar"* o *"menú"*.`,
            };
        }
        // E) Rebooking rápido para clientes frecuentes
        if (actionId === 'REBOOK_SAME' && lastService) {
            session.contextData.serviceId = lastService.id;
            session.contextData.serviceName = lastService.name;
            session.contextData.serviceDuration = lastService.durationMinutes;
            session.contextData.servicePrice = lastService.price;
            session.contextData.clientName = client?.name;
            session.contextData.clientId = client?.id;
            session.currentStep = 'AWAITING_DATE';
            const todayStr = datetime_utils_1.DateTimeUtils.getTodayDateString();
            const tomorrowStr = datetime_utils_1.DateTimeUtils.getTomorrowDateString();
            return {
                to: msg.from,
                type: 'interactive_buttons',
                header: `💈 ${lastService.name}`,
                body: `¡Excelente elección! Vamos con tu habitual *${lastService.name}* ($${lastService.price.toLocaleString('es-CO')}).\n\n¿Para qué día lo agendamos?`,
                buttons: [
                    { id: `DATE_${todayStr}`, title: 'Hoy' },
                    { id: `DATE_${tomorrowStr}`, title: 'Mañana' },
                    { id: 'DATE_PICKER', title: '📅 Otra Fecha' },
                ],
            };
        }
        // F) Solicitud explícita de desplegar calendario / otra fecha
        if (actionId === 'DATE_PICKER' || actionId === 'INTENT_OTHER_DATE' || intent === 'OTHER_DATE') {
            return this.generateCalendarPickerResponse(msg.from, clientFirstName, session);
        }
        // ========================================================================
        // 4. MÁQUINA DE ESTADOS FINITOS (FSM) DEL FLUJO DE RESERVA
        // ========================================================================
        // Fast-track: si el cliente menciona un corte específico en su mensaje
        const preMatchedService = whatsapp_nlu_1.WhatsAppNLU.matchServiceFromText(rawText, store_1.store.services);
        if (preMatchedService && (session.currentStep === 'IDLE' || session.currentStep === 'AWAITING_SERVICE' || intent === 'BOOK_INTENT')) {
            session.contextData.serviceId = preMatchedService.id;
            session.contextData.serviceName = preMatchedService.name;
            session.contextData.serviceDuration = preMatchedService.durationMinutes;
            session.contextData.servicePrice = preMatchedService.price;
            // Si también mencionó fecha (hoy, mañana, etc.)
            const preMatchedDate = datetime_utils_1.DateTimeUtils.parseDateFromText(rawText);
            if (preMatchedDate) {
                session.contextData.date = preMatchedDate;
                session.currentStep = 'AWAITING_SLOT';
                const slots = availability_engine_1.availabilityEngine.calculateSlotsForBarber({
                    barber,
                    service: preMatchedService,
                    date: preMatchedDate,
                    schedules: store_1.store.schedules,
                    blocks: store_1.store.blocks,
                    existingAppointments: store_1.store.appointments,
                    slotBufferMinutes: store_1.store.settings.slotBufferMinutes,
                });
                const freeSlots = slots.filter((s) => s.available);
                const slotsToShow = freeSlots.slice(0, 10);
                if (freeSlots.length === 0) {
                    session.currentStep = 'AWAITING_DATE';
                    return {
                        to: msg.from,
                        type: 'interactive_buttons',
                        header: 'Sin Cupos Libres',
                        body: `Lo sentimos${clientFirstName ? ' ' + clientFirstName : ''}, no hay turnos disponibles para el *${preMatchedDate}*.\n\n¿Deseas probar otra fecha?`,
                        buttons: [
                            { id: `DATE_${datetime_utils_1.DateTimeUtils.getTodayDateString()}`, title: 'Hoy' },
                            { id: `DATE_${datetime_utils_1.DateTimeUtils.getTomorrowDateString()}`, title: 'Mañana' },
                            { id: 'DATE_PICKER', title: '📅 Otra Fecha' },
                        ],
                    };
                }
                return {
                    to: msg.from,
                    type: 'interactive_list',
                    header: 'Horarios Libres',
                    body: `¡Entendido! Agendaremos *${preMatchedService.name}* para el *${preMatchedDate}* con *${barber.name}*.\n\nElige el horario que prefieras (o escribe la hora, ej: *"10:00 AM"*):`,
                    footer: 'Turnos calculados en tiempo real',
                    sections: [
                        {
                            title: 'Turnos Disponibles',
                            rows: slotsToShow.map((s, idx) => ({
                                id: `SLOT_${idx}_${encodeURIComponent(s.startTime)}_${encodeURIComponent(s.endTime)}`,
                                title: s.formattedTime,
                                description: `${preMatchedService.durationMinutes} min`,
                            })),
                        },
                    ],
                };
            }
            session.currentStep = 'AWAITING_DATE';
            const todayStr = datetime_utils_1.DateTimeUtils.getTodayDateString();
            const tomorrowStr = datetime_utils_1.DateTimeUtils.getTomorrowDateString();
            return {
                to: msg.from,
                type: 'interactive_buttons',
                header: 'Elige el Día',
                body: `¡Perfecto${clientFirstName ? ' ' + clientFirstName : ''}! Agendaremos: *${preMatchedService.name}* (${preMatchedService.price.toLocaleString('es-CO')}).\n\n¿Para qué día deseas tu cita con *${barber.name}*?`,
                buttons: [
                    { id: `DATE_${todayStr}`, title: 'Hoy' },
                    { id: `DATE_${tomorrowStr}`, title: 'Mañana' },
                    { id: 'DATE_PICKER', title: '📅 Otra Fecha' },
                ],
            };
        }
        // Reinicio, saludo o intención de agendar desde estado IDLE
        if (intent === 'GREETING' ||
            intent === 'BOOK_INTENT' ||
            actionId === 'INTENT_BOOK' ||
            session.currentStep === 'IDLE') {
            session.currentStep = 'AWAITING_SERVICE';
            const activeServices = store_1.store.services.filter((s) => s.isActive);
            // Si es un cliente frecuente reconocido
            if (client && lastService) {
                return {
                    to: msg.from,
                    type: 'interactive_list',
                    header: `💈 ${tenant.name}`,
                    body: `${timeGreeting} ¡Qué tal *${clientFirstName}*, un placer saludarte de nuevo! 💈\n\nTu último servicio con *${barber.name}* fue *${lastService.name}*. ¿Deseas agendar el mismo de siempre o prefieres elegir otro corte del catálogo?`,
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
                            rows: activeServices.filter((s) => s.id !== lastService.id).map((s) => ({
                                id: `SERVICE_${s.id}`,
                                title: s.name,
                                description: `${s.durationMinutes} min • $${s.price.toLocaleString('es-CO')}`,
                            })),
                        },
                    ],
                };
            }
            // Saludo para cliente nuevo o general
            return {
                to: msg.from,
                type: 'interactive_list',
                header: `💈 ${store_1.store.settings.shopName}`,
                body: store_1.store.settings.customGreeting || `${timeGreeting} Bienvenido a la atención personalizada de *${store_1.store.settings.barberName}* en *${store_1.store.settings.shopName}* 💈.\n\nPara reservarte el espacio ideal y recibirte sin esperas, ¿qué tipo de corte deseas agendar hoy?`,
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
            // ----------------------------------------------------------------------
            // PASO 1: SELECCIÓN DE CORTE O SERVICIO
            // ----------------------------------------------------------------------
            case 'AWAITING_SERVICE': {
                let selectedService = null;
                if (actionId.startsWith('SERVICE_')) {
                    const sId = actionId.replace('SERVICE_', '');
                    selectedService = store_1.store.findServiceById(sId) || null;
                }
                else {
                    // Coincidencia inteligente por texto libre
                    selectedService = whatsapp_nlu_1.WhatsAppNLU.matchServiceFromText(rawText, store_1.store.services);
                }
                if (!selectedService) {
                    selectedService = store_1.store.services.find((s) => s.isActive) || store_1.store.services[0];
                }
                session.contextData.serviceId = selectedService.id;
                session.contextData.serviceName = selectedService.name;
                session.contextData.serviceDuration = selectedService.durationMinutes;
                session.contextData.servicePrice = selectedService.price;
                session.currentStep = 'AWAITING_DATE';
                const todayStr = datetime_utils_1.DateTimeUtils.getTodayDateString();
                const tomorrowStr = datetime_utils_1.DateTimeUtils.getTomorrowDateString();
                const dayNamesMap = { 1: 'Lunes', 2: 'Martes', 3: 'Miércoles', 4: 'Jueves', 5: 'Viernes', 6: 'Sábado', 7: 'Domingo' };
                const restDaysList = [1, 2, 3, 4, 5, 6, 7].filter(d => !store_1.store.settings.activeDays.includes(d));
                const restDayNamesStr = restDaysList.map(d => dayNamesMap[d] + 's').join(', ') || 'Domingos';
                return {
                    to: msg.from,
                    type: 'interactive_buttons',
                    header: 'Elige el Día',
                    body: `¡Excelente elección${clientFirstName ? ', ' + clientFirstName : ''}! 👌 Agendaremos: *${selectedService.name}* ($${selectedService.price.toLocaleString('es-CO')}).\n\n¿Para qué día deseas tu cita con *${barber.name}*?\n\n(Atendemos de Lunes a Sábado; los *${restDayNamesStr}* *${barber.name}* toma su descanso semanal 💈).`,
                    buttons: [
                        { id: `DATE_${todayStr}`, title: 'Hoy' },
                        { id: `DATE_${tomorrowStr}`, title: 'Mañana' },
                        { id: 'DATE_PICKER', title: '📅 Otra Fecha' },
                    ],
                };
            }
            // ----------------------------------------------------------------------
            // PASO 2: SELECCIÓN DE FECHA -> CÁLCULO DE HORARIOS LIBRES
            // ----------------------------------------------------------------------
            case 'AWAITING_DATE': {
                if (actionId === 'DATE_PICKER' || actionId === 'INTENT_OTHER_DATE') {
                    return this.generateCalendarPickerResponse(msg.from, clientFirstName, session);
                }
                let selectedDate = '';
                if (actionId.startsWith('DATE_')) {
                    selectedDate = actionId.replace('DATE_', '');
                }
                else if (rawText) {
                    selectedDate = datetime_utils_1.DateTimeUtils.parseDateFromText(rawText) || datetime_utils_1.DateTimeUtils.getTodayDateString();
                }
                else {
                    selectedDate = datetime_utils_1.DateTimeUtils.getTodayDateString();
                }
                // VERIFICAR DÍA DE DESCANSO DEL BARBERO
                const dayOfWeek = datetime_utils_1.DateTimeUtils.getDayOfWeek(selectedDate);
                const dayNames = { 1: 'Lunes', 2: 'Martes', 3: 'Miércoles', 4: 'Jueves', 5: 'Viernes', 6: 'Sábado', 7: 'Domingo' };
                const isDayOff = !store_1.store.settings.activeDays.includes(dayOfWeek);
                if (isDayOff) {
                    const dayName = dayNames[dayOfWeek] || 'ese día';
                    const todayStr = datetime_utils_1.DateTimeUtils.getTodayDateString();
                    const tomorrowStr = datetime_utils_1.DateTimeUtils.getTomorrowDateString();
                    return {
                        to: msg.from,
                        type: 'interactive_buttons',
                        header: '⛔ Día de Descanso Semanal',
                        body: `¡Hola${clientFirstName ? ' ' + clientFirstName : ''}! El *${selectedDate}* cae un *${dayName}*. Ten en cuenta que los *${dayName}s* *${barber.name}* toma su jornada de descanso semanal para recargar energías 💈.\n\nAtendemos con gusto de *${store_1.store.settings.activeDays.map(d => dayNames[d]).join(', ')}*. Por favor escoge otra fecha:`,
                        buttons: [
                            { id: `DATE_${todayStr}`, title: 'Hoy' },
                            { id: `DATE_${tomorrowStr}`, title: 'Mañana' },
                            { id: 'DATE_PICKER', title: '📅 Otra Fecha' },
                        ],
                    };
                }
                session.contextData.date = selectedDate;
                const service = store_1.store.findServiceById(session.contextData.serviceId || '') || store_1.store.services[0];
                // Calcular slots en tiempo real con el motor de disponibilidad
                const slots = availability_engine_1.availabilityEngine.calculateSlotsForBarber({
                    barber,
                    service,
                    date: selectedDate,
                    schedules: store_1.store.schedules,
                    blocks: store_1.store.blocks,
                    existingAppointments: store_1.store.appointments,
                    slotBufferMinutes: store_1.store.settings.slotBufferMinutes,
                });
                const freeSlots = slots.filter((s) => s.available);
                if (freeSlots.length === 0) {
                    return {
                        to: msg.from,
                        type: 'interactive_buttons',
                        header: 'Sin Cupos Libres',
                        body: `Lo sentimos${clientFirstName ? ' ' + clientFirstName : ''}, no hay turnos disponibles para el *${selectedDate}* (o ya culminó la jornada de atención).\n\n¿Deseas revisar otra fecha?`,
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
                    header: 'Horarios Libres',
                    body: `📅 *Fecha:* ${selectedDate}\n✂️ *Corte:* ${service.name} (${service.durationMinutes} min)\n💈 *Barbero:* ${barber.name}\n\nSelecciona el horario que más te convenga (o escríbeme la hora, ej: *"10:00 AM"*):`,
                    footer: 'Turnos calculados en tiempo real',
                    sections: [
                        {
                            title: 'Turnos Disponibles',
                            rows: slotsToShow.map((s, idx) => ({
                                id: `SLOT_${idx}_${encodeURIComponent(s.startTime)}_${encodeURIComponent(s.endTime)}`,
                                title: s.formattedTime,
                                description: `${service.durationMinutes} min (+10m preparación)`,
                            })),
                        },
                    ],
                };
            }
            // ----------------------------------------------------------------------
            // PASO 3: SELECCIÓN DE SLOT -> IDENTIFICACIÓN DEL CLIENTE
            // ----------------------------------------------------------------------
            case 'AWAITING_SLOT': {
                let chosenSlot = null;
                if (actionId.startsWith('SLOT_')) {
                    const parts = actionId.split('_');
                    const startISO = decodeURIComponent(parts[2]);
                    const endISO = decodeURIComponent(parts[3]);
                    chosenSlot = { startTime: startISO, endTime: endISO };
                }
                else if (rawText) {
                    // Coincidencia inteligente de hora en lenguaje natural
                    const selectedDate = session.contextData.date || datetime_utils_1.DateTimeUtils.getTodayDateString();
                    const service = store_1.store.findServiceById(session.contextData.serviceId || '') || store_1.store.services[0];
                    const slots = availability_engine_1.availabilityEngine.calculateSlotsForBarber({
                        barber,
                        service,
                        date: selectedDate,
                        schedules: store_1.store.schedules,
                        blocks: store_1.store.blocks,
                        existingAppointments: store_1.store.appointments,
                        slotBufferMinutes: store_1.store.settings.slotBufferMinutes,
                    });
                    const freeSlots = slots.filter((s) => s.available);
                    const norm = whatsapp_nlu_1.WhatsAppNLU.normalize(rawText);
                    if (norm.includes('primer') || norm.includes('mas temprano') || norm.includes('temprano')) {
                        if (freeSlots.length > 0)
                            chosenSlot = { startTime: freeSlots[0].startTime, endTime: freeSlots[0].endTime };
                    }
                    else if (norm.includes('ultim') || norm.includes('tarde')) {
                        if (freeSlots.length > 0)
                            chosenSlot = { startTime: freeSlots[freeSlots.length - 1].startTime, endTime: freeSlots[freeSlots.length - 1].endTime };
                    }
                    else {
                        // Regex para extraer números de hora
                        const matchTime = norm.match(/\b(1[0-2]|0?[1-9])(?::([0-5][0-9]))?\s*(am|pm)?\b/i);
                        if (matchTime && freeSlots.length > 0) {
                            let hour = parseInt(matchTime[1], 10);
                            const minutes = matchTime[2] ? parseInt(matchTime[2], 10) : 0;
                            let period = matchTime[3] ? matchTime[3].toLowerCase() : '';
                            if (!period) {
                                // Inferir período según horario comercial estándar
                                period = (hour >= 1 && hour <= 7) ? 'pm' : ((hour >= 8 && hour <= 12) ? 'am' : 'pm');
                            }
                            if (period === 'pm' && hour < 12)
                                hour += 12;
                            if (period === 'am' && hour === 12)
                                hour = 0;
                            const targetTotalMinutes = hour * 60 + minutes;
                            // Encontrar el turno más próximo dentro de un margen de 30 minutos
                            const matched = freeSlots.find((s) => {
                                const sDate = new Date(s.startTime);
                                const sInfo = datetime_utils_1.DateTimeUtils.extractDateAndTime(sDate);
                                return Math.abs(sInfo.totalMinutes - targetTotalMinutes) <= 30;
                            });
                            if (matched) {
                                chosenSlot = { startTime: matched.startTime, endTime: matched.endTime };
                            }
                        }
                    }
                    if (!chosenSlot && freeSlots.length > 0) {
                        const slotsToShow = freeSlots.slice(0, 10);
                        return {
                            to: msg.from,
                            type: 'interactive_list',
                            header: 'Horarios Disponibles',
                            body: `No encontré un espacio exacto para "${rawText}". Por favor toca uno de los horarios libres a continuación:\n\n📅 *Fecha:* ${selectedDate}\n✂️ *Corte:* ${service.name}`,
                            footer: 'Toca una opción de la lista',
                            sections: [
                                {
                                    title: 'Turnos Libres',
                                    rows: slotsToShow.map((s, idx) => ({
                                        id: `SLOT_${idx}_${encodeURIComponent(s.startTime)}_${encodeURIComponent(s.endTime)}`,
                                        title: s.formattedTime,
                                        description: `${service.durationMinutes} min (+10m preparación)`,
                                    })),
                                },
                            ],
                        };
                    }
                }
                if (!chosenSlot) {
                    return {
                        to: msg.from,
                        type: 'text',
                        body: '⚠️ Por favor selecciona uno de los horarios libres tocando el botón de la lista o escribe una hora (ej: "10:00 AM" o "3:00 PM").',
                    };
                }
                session.contextData.slotStartTime = chosenSlot.startTime;
                session.contextData.slotEndTime = chosenSlot.endTime;
                // Si ya tenemos registro del cliente en la base de datos, confirmamos de una vez
                if (client) {
                    session.contextData.clientName = client.name;
                    session.contextData.clientId = client.id;
                    return await this.confirmAndBookAppointment(tenantId, session, msg.from);
                }
                // Cliente nuevo: pedir nombre
                session.currentStep = 'AWAITING_NAME';
                return {
                    to: msg.from,
                    type: 'text',
                    body: `🕒 Horario apartado temporalmente 🔒.\n\nPara personalizar tu cita con *${barber.name}* y recibirte con un buen café o bebida de cortesía, por favor escribe tu *Nombre y Apellido*:`,
                };
            }
            // ----------------------------------------------------------------------
            // PASO 4: CAPTURAR NOMBRE DE CLIENTE NUEVO
            // ----------------------------------------------------------------------
            case 'AWAITING_NAME': {
                const name = rawText.trim();
                if (name.length < 2) {
                    return {
                        to: msg.from,
                        type: 'text',
                        body: '⚠️ Por favor ingresa tu nombre completo para anotarte en la agenda:',
                    };
                }
                let newClient = store_1.store.findClientByPhone(msg.from);
                if (!newClient) {
                    newClient = {
                        id: `client-${Date.now()}`,
                        tenantId,
                        name,
                        whatsappPhone: msg.from,
                        totalNoShows: 0,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    };
                    store_1.store.clients.push(newClient);
                }
                session.contextData.clientName = name;
                session.contextData.clientId = newClient.id;
                return await this.confirmAndBookAppointment(tenantId, session, msg.from);
            }
            default:
                session.currentStep = 'IDLE';
                return {
                    to: msg.from,
                    type: 'text',
                    body: 'Sesión finalizada. Envía *"Hola"* para consultar horarios o agendar un nuevo corte con Mateo Silva.',
                };
        }
    }
    /**
     * Ejecución atómica de la reserva con mutex y mensaje de confirmación
     */
    async confirmAndBookAppointment(tenantId, session, phone) {
        const ctx = session.contextData;
        const barber = store_1.store.getPrimaryBarber();
        return await store_1.store.acquireLock(async () => {
            const startTime = new Date(ctx.slotStartTime);
            const endTime = new Date(ctx.slotEndTime);
            const isStillFree = availability_engine_1.availabilityEngine.isSlotFree({
                barberId: barber.id,
                startTime,
                endTime,
                existingAppointments: store_1.store.appointments,
                blocks: store_1.store.blocks,
            });
            if (!isStillFree) {
                session.currentStep = 'AWAITING_DATE';
                return {
                    to: phone,
                    type: 'text',
                    body: `⚠️ Lo sentimos, ese turno acaba de ser tomado por otro cliente. Por favor elige otro horario disponible.`,
                };
            }
            const newAppointment = {
                id: `app-${Date.now()}`,
                tenantId,
                barberId: barber.id,
                clientId: ctx.clientId,
                serviceId: ctx.serviceId,
                startTime,
                endTime,
                totalPrice: ctx.servicePrice || 35000,
                status: 'confirmed',
                notes: `Agendado por WhatsApp Bot para ${ctx.clientName}`,
                reminderSentAt: null,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            store_1.store.appointments.push(newAppointment);
            store_1.store.persist();
            session.currentStep = 'CONFIRMED';
            session.contextData = {};
            const startInfo = datetime_utils_1.DateTimeUtils.extractDateAndTime(startTime);
            const endInfo = datetime_utils_1.DateTimeUtils.extractDateAndTime(endTime);
            const timeRangeStr = `${datetime_utils_1.DateTimeUtils.format12h(startInfo.totalMinutes)} - ${datetime_utils_1.DateTimeUtils.format12h(endInfo.totalMinutes)}`;
            // Notificar al barbero en tiempo real vía Socket.IO
            events_1.eventBus.emit('barber:notification', {
                type: 'new_booking',
                title: '🔔 ¡Nueva Cita Agendada!',
                message: `${ctx.clientName} agendó ${ctx.serviceName} para el ${startInfo.dateStr} a las ${timeRangeStr}.`,
                appointmentId: newAppointment.id,
                clientName: ctx.clientName,
                serviceName: ctx.serviceName,
                time: timeRangeStr,
                date: startInfo.dateStr,
                phone,
                timestamp: new Date().toISOString(),
            });
            events_1.eventBus.emit('dashboard:refresh');
            return {
                to: phone,
                type: 'text',
                body: `🎉 *¡CITA AGENDADA CON ÉXITO!* 💈\n\n` +
                    `👤 *Cliente:* ${ctx.clientName}\n` +
                    `✂️ *Corte:* ${ctx.serviceName}\n` +
                    `💈 *Barbero:* ${barber.name}\n` +
                    `📅 *Fecha:* ${startInfo.dateStr}\n` +
                    `⏰ *Horario:* ${timeRangeStr}\n` +
                    `💵 *Valor:* $${(ctx.servicePrice || 0).toLocaleString('es-CO')}\n\n` +
                    `📍 *Ubicación:* ${store_1.store.settings.address}\n\n` +
                    `☕ *Atención Personalizada:* ${store_1.store.settings.barberName} ya tiene tu sillón preparado. Te esperamos con un buen espresso o agua helada. Te enviaremos un recordatorio 20 minutos antes de tu turno. ¡Será un gusto atenderte!`,
            };
        });
    }
    /**
     * Genera el mensaje interactivo de recordatorio anti-no-show (20 minutos antes)
     */
    generateReminderMessage(appointmentId) {
        const app = store_1.store.findAppointmentById(appointmentId);
        if (!app || app.status === 'cancelled')
            return null;
        const client = store_1.store.clients.find((c) => c.id === app.clientId);
        const service = store_1.store.findServiceById(app.serviceId);
        const barber = store_1.store.getPrimaryBarber();
        if (!client)
            return null;
        app.reminderSentAt = new Date();
        const clientFirstName = client.name.split(' ')[0];
        const startInfo = datetime_utils_1.DateTimeUtils.extractDateAndTime(app.startTime);
        return {
            to: client.whatsappPhone,
            type: 'interactive_buttons',
            header: '⏰ Recordatorio de Cita (En 20 Minutos)',
            body: `¡Hola *${clientFirstName}*! Tu cita para *${service?.name || 'Corte'}* con *${barber.name}* es en 20 minutos (a las *${datetime_utils_1.DateTimeUtils.format12h(startInfo.totalMinutes)}*).\n\n📍 *Ubicación:* ${store_1.store.settings.address}\n\n¿Nos confirmas que vienes en camino o ya estás en el local?`,
            footer: 'Si cancelas ahora, liberarás el turno para otro cliente',
            buttons: [
                { id: `CONFIRM_COMING_${app.id}`, title: '✅ Voy en camino' },
                { id: `CANCEL_APPOINTMENT_${app.id}`, title: '❌ Cancelar turno' },
            ],
        };
    }
}
exports.WhatsAppService = WhatsAppService;
exports.whatsappService = new WhatsAppService();
exports.default = exports.whatsappService;
