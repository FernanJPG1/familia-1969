import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';

import { store } from './database/store';
import { AvailabilityEngine } from './modules/availability/availability.engine';
import { whatsappService } from './modules/whatsapp/whatsapp.service';
import { Appointment } from './core/types';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: { origin: '*' },
});

const PORT = process.env.PORT || 3000;
const availabilityEngine = new AvailabilityEngine({ slotBufferMinutes: 10 });

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// ============================================================================
// 1. HEALTH & METADATA
// ============================================================================
app.get('/api/health', (req: any, res: any) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'Barberia SaaS B2B Backend',
    tenant: store.tenants[0]?.name,
    activeAppointments: store.appointments.length,
    barbersCount: store.barbers.length,
  });
});

// ============================================================================
// 2. DASHBOARD DATA API (Soporta filtrado por fecha)
// ============================================================================
app.get('/api/dashboard/today', (req: any, res: any) => {
  const tenantId = (req.query?.tenantId as string) || 'tenant-demo-1';
  const queryDate = (req.query?.date as string) || new Date().toISOString().split('T')[0];

  const tenant = store.tenants.find((t) => t.id === tenantId) || store.tenants[0];
  const barbers = store.barbers.filter((b) => b.tenantId === tenantId && b.isActive);
  const services = store.services.filter((s) => s.tenantId === tenantId && s.isActive);

  // Filtrar citas del día especificado
  const appointmentsForDate = store.appointments
    .filter((a) => {
      if (a.tenantId !== tenantId) return false;
      const aDate = new Date(a.startTime).toISOString().split('T')[0];
      return aDate === queryDate;
    })
    .map((a) => {
      const barber = store.barbers.find((b) => b.id === a.barberId);
      const client = store.clients.find((c) => c.id === a.clientId);
      const service = store.services.find((s) => s.id === a.serviceId);
      const commissionAmount = barber 
        ? Math.round((a.totalPrice * barber.commissionPercentage) / 100)
        : 0;

      return {
        ...a,
        barberName: barber?.name || 'Desconocido',
        barberColor: barber?.colorTag || '#3B82F6',
        barberCommissionPct: barber?.commissionPercentage || 0,
        commissionAmount,
        clientName: client?.name || 'Cliente Ocasional',
        clientPhone: client?.whatsappPhone || '',
        clientNoShows: client?.totalNoShows || 0,
        serviceName: service?.name || 'Servicio General',
        serviceDuration: service?.durationMinutes || 30,
      };
    });

  // Métricas del día
  const activeCount = appointmentsForDate.filter((a) => a.status !== 'cancelled').length;
  const completedCount = appointmentsForDate.filter((a) => a.status === 'completed').length;
  const noShowCount = appointmentsForDate.filter((a) => a.status === 'no_show').length;
  const totalRevenue = appointmentsForDate
    .filter((a) => a.status === 'completed' || a.status === 'confirmed')
    .reduce((sum, a) => sum + a.totalPrice, 0);

  const totalCommissions = appointmentsForDate
    .filter((a) => a.status === 'completed' || a.status === 'confirmed')
    .reduce((sum, a) => sum + (a.commissionAmount || 0), 0);

  // Bloqueos de agenda para la fecha
  const blocksForDate = store.blocks.filter((b) => b.date === queryDate);

  res.json({
    date: queryDate,
    tenant,
    barbers,
    services,
    appointments: appointmentsForDate,
    blocks: blocksForDate,
    metrics: {
      totalBookings: activeCount,
      completedCount,
      noShowCount,
      totalRevenue,
      totalCommissions,
      netBarbershopRevenue: totalRevenue - totalCommissions,
      occupancyPercentage: Math.min(100, Math.round((activeCount / (barbers.length * 8)) * 100)),
    },
  });
});

// ============================================================================
// 3. CREACIÓN MANUAL DE CITAS (Para recepción o barberos)
// ============================================================================
app.post('/api/appointments', async (req: any, res: any) => {
  try {
    const { barberId, serviceId, clientName, clientPhone, startTimeISO, notes } = req.body;
    const tenantId = 'tenant-demo-1';

    if (!barberId || !serviceId || !clientName || !startTimeISO) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    const service = store.services.find((s) => s.id === serviceId);
    if (!service) return res.status(404).json({ error: 'Servicio no encontrado' });

    const startTime = new Date(startTimeISO);
    const endTime = new Date(startTime.getTime() + service.durationMinutes * 60000);

    // Validación atómica
    const isFree = await store.acquireLock(async () => {
      return availabilityEngine.isSlotFree({
        barberId,
        startTime,
        endTime,
        existingAppointments: store.appointments,
        blocks: store.blocks,
      });
    });

    if (!isFree) {
      return res.status(409).json({ error: 'El horario seleccionado ya no está disponible (colisión detectada)' });
    }

    // Buscar o crear cliente
    let client = store.clients.find((c) => c.whatsappPhone === clientPhone);
    if (!client) {
      client = {
        id: `client-${Date.now()}`,
        tenantId,
        name: clientName,
        whatsappPhone: clientPhone || '573000000000',
        totalNoShows: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      store.clients.push(client);
    }

    const newAppointment: Appointment = {
      id: `app-manual-${Date.now()}`,
      tenantId,
      barberId,
      clientId: client.id,
      serviceId,
      startTime,
      endTime,
      totalPrice: service.price,
      status: 'confirmed',
      notes: notes || 'Agendado manualmente desde el Dashboard',
      reminderSentAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    store.appointments.push(newAppointment);

    io.emit('dashboard:refresh');
    res.status(201).json({ success: true, appointment: newAppointment });
  } catch (err: any) {
    console.error('Error creando cita:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// 4. ACTUALIZACIÓN RÁPIDA DE ESTADO DE CITA
// ============================================================================
app.post('/api/appointments/:id/status', (req: any, res: any) => {
  const { id } = req.params;
  const { status, notes } = req.body;

  const appItem = store.appointments.find((a) => a.id === id);
  if (!appItem) {
    return res.status(404).json({ error: 'Cita no encontrada' });
  }

  const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled', 'no_show'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Estado no válido' });
  }

  appItem.status = status;
  if (notes !== undefined) appItem.notes = notes;
  appItem.updatedAt = new Date();

  // Si se marca como no_show, incrementar el contador del cliente
  if (status === 'no_show') {
    const client = store.clients.find((c) => c.id === appItem.clientId);
    if (client) {
      client.totalNoShows += 1;
    }
  }

  // Notificar por WebSocket a todos los dashboards conectados
  io.emit('appointment:updated', { appointment: appItem, status });
  io.emit('dashboard:refresh');

  res.json({ success: true, appointment: appItem });
});

// ============================================================================
// 5. MOTOR DE DISPONIBILIDAD (Endpoint de Inspección y Cálculo)
// ============================================================================
app.get('/api/availability', (req: any, res: any) => {
  const { barberId, serviceId, date } = req.query as {
    barberId?: string;
    serviceId: string;
    date: string;
  };

  if (!serviceId || !date) {
    return res.status(400).json({ error: 'serviceId y date son obligatorios (YYYY-MM-DD)' });
  }

  const service = store.services.find((s) => s.id === serviceId);
  if (!service) {
    return res.status(404).json({ error: 'Servicio no encontrado' });
  }

  let targetBarbers = store.barbers.filter((b) => b.isActive);
  if (barberId) {
    targetBarbers = targetBarbers.filter((b) => b.id === barberId);
  }

  const results = targetBarbers.map((barber) => {
    const slots = availabilityEngine.calculateSlotsForBarber({
      barber,
      service,
      date,
      schedules: store.schedules,
      blocks: store.blocks,
      existingAppointments: store.appointments,
      slotBufferMinutes: 10,
    });

    return {
      barber: { 
        id: barber.id, 
        name: barber.name, 
        colorTag: barber.colorTag,
        commissionPercentage: barber.commissionPercentage 
      },
      slots,
      freeSlotsCount: slots.filter((s) => s.available).length,
      totalGeneratedSlots: slots.length,
    };
  });

  res.json({ 
    date, 
    service: {
      id: service.id,
      name: service.name,
      durationMinutes: service.durationMinutes,
      price: service.price,
      bufferMinutes: 10,
    }, 
    results 
  });
});

// ============================================================================
// 6. REPORTES Y COMISIONES POR BARBERO
// ============================================================================
app.get('/api/reports/commissions', (req: any, res: any) => {
  const tenantId = (req.query?.tenantId as string) || 'tenant-demo-1';
  const barbers = store.barbers.filter((b) => b.tenantId === tenantId);

  const report = barbers.map((barber) => {
    const apps = store.appointments.filter(
      (a) => a.barberId === barber.id && (a.status === 'completed' || a.status === 'confirmed')
    );

    const grossRevenue = apps.reduce((sum, a) => sum + a.totalPrice, 0);
    const commission = Math.round((grossRevenue * barber.commissionPercentage) / 100);
    const barbershopShare = grossRevenue - commission;

    return {
      barberId: barber.id,
      barberName: barber.name,
      colorTag: barber.colorTag,
      commissionPercentage: barber.commissionPercentage,
      totalAppointments: apps.length,
      grossRevenue,
      commissionEarned: commission,
      barbershopShare,
    };
  });

  res.json({ report });
});

// ============================================================================
// 7. SIMULADOR & RECORDATORIOS DE WHATSAPP
// ============================================================================
app.post('/api/appointments/:id/trigger-reminder', (req: any, res: any) => {
  const { id } = req.params;
  const message = whatsappService.generateReminderMessage(id);

  if (!message) {
    return res.status(400).json({ error: 'No se pudo generar recordatorio para esta cita' });
  }

  io.emit('whatsapp:reminder_sent', { appointmentId: id, message });
  res.json({ success: true, message });
});

app.post('/api/whatsapp/simulate', async (req: any, res: any) => {
  try {
    const { from = '573001234567', type = 'text', text, buttonId, listId } = req.body;
    const tenantId = 'tenant-demo-1';

    const response = await whatsappService.handleIncomingMessage(tenantId, {
      from,
      type,
      text,
      buttonId,
      listId,
    });

    io.emit('dashboard:refresh');
    res.json(response);
  } catch (error: any) {
    console.error('Error en simulación WhatsApp:', error);
    res.status(500).json({ error: error.message });
  }
});

// Webhook Meta Cloud API
app.get('/api/whatsapp/webhook', (req: any, res: any) => {
  const mode = req.query?.['hub.mode'];
  const token = req.query?.['hub.verify_token'];
  const challenge = req.query?.['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.META_WA_VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  res.status(403).send('Forbidden');
});

app.post('/api/whatsapp/webhook', async (req: any, res: any) => {
  try {
    const body = req.body;
    const entry = body?.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const message = value?.messages?.[0];

    if (message) {
      const from = message.from;
      let text = '';
      let buttonId = '';
      let listId = '';
      let type: 'text' | 'interactive_button' | 'interactive_list' = 'text';

      if (message.type === 'text') {
        text = message.text?.body;
      } else if (message.type === 'interactive') {
        if (message.interactive.type === 'button_reply') {
          type = 'interactive_button';
          buttonId = message.interactive.button_reply.id;
        } else if (message.interactive.type === 'list_reply') {
          type = 'interactive_list';
          listId = message.interactive.list_reply.id;
        }
      }

      await whatsappService.handleIncomingMessage('tenant-demo-1', {
        from,
        type,
        text,
        buttonId,
        listId,
      });

      io.emit('dashboard:refresh');
    }

    res.status(200).send('EVENT_RECEIVED');
  } catch (err) {
    console.error('Error procesando webhook Meta:', err);
    res.status(500).send('ERROR');
  }
});

// ============================================================================
// 8. INICIALIZACIÓN
// ============================================================================
server.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`💈 BARBERÍA SAAS B2B - SERVIDOR MEJORADO ACTIVO`);
  console.log(`🚀 URL: http://localhost:${PORT}`);
  console.log(`📡 WebSocket: Activo y escuchando eventos en tiempo real`);
  console.log(`🤖 WhatsApp Engine & Simulador: Listo`);
  console.log(`======================================================\n`);
});
