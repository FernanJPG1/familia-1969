import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';

import { store } from './database/store';
import { AvailabilityEngine } from './modules/availability/availability.engine';
import { whatsappService } from './modules/whatsapp/whatsapp.service';
import { Appointment, Service } from './core/types';

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
  const barber = store.barbers[0];
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'Barberia Solo-Barber Mobile Backend',
    barber: barber?.name,
    activeAppointments: store.appointments.length,
    servicesCount: store.services.length,
  });
});

// ============================================================================
// 2. GESTIÓN DE CORTES Y SERVICIOS (CRUD por el Barbero)
// ============================================================================
app.get('/api/services', (req: any, res: any) => {
  res.json({ services: store.services.filter((s) => s.isActive) });
});

app.post('/api/services', (req: any, res: any) => {
  const { name, durationMinutes, price } = req.body;

  if (!name || !durationMinutes || !price) {
    return res.status(400).json({ error: 'Nombre, duración (min) y precio son obligatorios' });
  }

  const newService: Service = {
    id: `srv-${Date.now()}`,
    tenantId: 'tenant-demo-1',
    name: name.trim(),
    durationMinutes: Number(durationMinutes),
    price: Number(price),
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  store.services.push(newService);

  io.emit('services:updated', { service: newService });
  io.emit('dashboard:refresh');

  res.status(201).json({ success: true, service: newService });
});

app.delete('/api/services/:id', (req: any, res: any) => {
  const { id } = req.params;
  const srv = store.services.find((s) => s.id === id);

  if (!srv) {
    return res.status(404).json({ error: 'Servicio no encontrado' });
  }

  srv.isActive = false; // Soft delete
  srv.updatedAt = new Date();

  io.emit('services:updated', { deletedId: id });
  io.emit('dashboard:refresh');

  res.json({ success: true, message: 'Tipo de corte eliminado' });
});

// ============================================================================
// 3. CONFIGURACIÓN TOTAL DEL BARBERO (Horarios, Estudio, Bot, Buffer)
// ============================================================================
app.get('/api/settings', (req: any, res: any) => {
  res.json({ settings: store.settings });
});

app.put('/api/settings', (req: any, res: any) => {
  try {
    const updated = store.updateSettings(req.body);
    io.emit('settings:updated', { settings: updated });
    io.emit('dashboard:refresh');
    res.json({ success: true, settings: updated });
  } catch (err: any) {
    console.error('Error actualizando ajustes:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// 4. DASHBOARD DATA API (Modo 1 Solo Barbero)
// ============================================================================
app.get('/api/dashboard/today', (req: any, res: any) => {
  const tenantId = 'tenant-demo-1';
  const queryDate = (req.query?.date as string) || new Date().toISOString().split('T')[0];

  const tenant = store.tenants[0];
  const barber = store.barbers[0]; // 1 Solo Barbero
  const services = store.services.filter((s) => s.isActive);

  // Filtrar citas del día especificado
  const appointmentsForDate = store.appointments
    .filter((a) => {
      const aDate = new Date(a.startTime).toISOString().split('T')[0];
      return aDate === queryDate;
    })
    .map((a) => {
      const client = store.clients.find((c) => c.id === a.clientId);
      const service = store.services.find((s) => s.id === a.serviceId);

      return {
        ...a,
        barberName: barber.name,
        barberColor: barber.colorTag,
        barberCommissionPct: barber.commissionPercentage,
        commissionAmount: a.totalPrice, // 100% para el barbero independiente
        clientName: client?.name || 'Cliente Ocasional',
        clientPhone: client?.whatsappPhone || '',
        clientNoShows: client?.totalNoShows || 0,
        serviceName: service?.name || 'Corte Personalizado',
        serviceDuration: service?.durationMinutes || 35,
      };
    });

  // Métricas del día
  const activeCount = appointmentsForDate.filter((a) => a.status !== 'cancelled').length;
  const completedCount = appointmentsForDate.filter((a) => a.status === 'completed').length;
  const noShowCount = appointmentsForDate.filter((a) => a.status === 'no_show').length;
  const totalRevenue = appointmentsForDate
    .filter((a) => a.status === 'completed' || a.status === 'confirmed')
    .reduce((sum, a) => sum + a.totalPrice, 0);

  const blocksForDate = store.blocks.filter((b) => b.date === queryDate);

  res.json({
    date: queryDate,
    tenant,
    barber,
    barbers: [barber],
    services,
    settings: store.settings,
    appointments: appointmentsForDate,
    blocks: blocksForDate,
    metrics: {
      totalBookings: activeCount,
      completedCount,
      noShowCount,
      totalRevenue,
      myEarnings: totalRevenue,
      occupancyPercentage: Math.min(100, Math.round((activeCount / 8) * 100)),
    },
  });
});

// ============================================================================
// 4. AGENDAR CITA MANUAL RÁPIDA (Desde la App Móvil del Barbero)
// ============================================================================
app.post('/api/appointments', async (req: any, res: any) => {
  try {
    const { serviceId, clientName, clientPhone, startTimeISO, notes } = req.body;
    const barber = store.barbers[0];

    if (!serviceId || !clientName || !startTimeISO) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    const service = store.services.find((s) => s.id === serviceId);
    if (!service) return res.status(404).json({ error: 'Servicio no encontrado' });

    const startTime = new Date(startTimeISO);
    const endTime = new Date(startTime.getTime() + service.durationMinutes * 60000);

    const isFree = await store.acquireLock(async () => {
      return availabilityEngine.isSlotFree({
        barberId: barber.id,
        startTime,
        endTime,
        existingAppointments: store.appointments,
        blocks: store.blocks,
      });
    });

    if (!isFree) {
      return res.status(409).json({ error: 'Ese horario ya tiene un turno reservado' });
    }

    let client = store.clients.find((c) => c.whatsappPhone === clientPhone);
    if (!client) {
      client = {
        id: `client-${Date.now()}`,
        tenantId: 'tenant-demo-1',
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
      tenantId: 'tenant-demo-1',
      barberId: barber.id,
      clientId: client.id,
      serviceId,
      startTime,
      endTime,
      totalPrice: service.price,
      status: 'confirmed',
      notes: notes || 'Agendado manualmente desde la App Móvil',
      reminderSentAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    store.appointments.push(newAppointment);

    io.emit('dashboard:refresh');
    res.status(201).json({ success: true, appointment: newAppointment });
  } catch (err: any) {
    console.error('Error creando cita manual:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// 5. ACTUALIZAR ESTADO DE CITA
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

  if (status === 'no_show') {
    const client = store.clients.find((c) => c.id === appItem.clientId);
    if (client) {
      client.totalNoShows += 1;
    }
  }

  io.emit('appointment:updated', { appointment: appItem, status });
  io.emit('dashboard:refresh');

  res.json({ success: true, appointment: appItem });
});

// ============================================================================
// 6. MOTOR DE DISPONIBILIDAD
// ============================================================================
app.get('/api/availability', (req: any, res: any) => {
  const { serviceId, date } = req.query as {
    serviceId: string;
    date: string;
  };

  const barber = store.barbers[0];

  if (!serviceId || !date) {
    return res.status(400).json({ error: 'serviceId y date son requeridos' });
  }

  const service = store.services.find((s) => s.id === serviceId);
  if (!service) {
    return res.status(404).json({ error: 'Servicio no encontrado' });
  }

  const slots = availabilityEngine.calculateSlotsForBarber({
    barber,
    service,
    date,
    schedules: store.schedules,
    blocks: store.blocks,
    existingAppointments: store.appointments,
    slotBufferMinutes: store.settings.slotBufferMinutes,
  });

  res.json({ 
    date, 
    service,
    barber: { id: barber.id, name: barber.name, colorTag: barber.colorTag },
    slots,
    freeSlotsCount: slots.filter((s) => s.available).length,
    totalGeneratedSlots: slots.length,
  });
});

// ============================================================================
// 7. SIMULADOR & RECORDATORIOS DE WHATSAPP
// ============================================================================
app.post('/api/appointments/:id/trigger-reminder', (req: any, res: any) => {
  const { id } = req.params;
  const message = whatsappService.generateReminderMessage(id);

  if (!message) {
    return res.status(400).json({ error: 'No se pudo generar recordatorio' });
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
  console.log(`💈 BARBERÍA APP - 1 SOLO BARBERO`);
  console.log(`👤 Barbero: Mateo Silva (Master Barber)`);
  console.log(`✂️ Catálogo de Cortes Dinámico: Activo`);
  console.log(`🚀 URL: http://localhost:${PORT}`);
  console.log(`======================================================\n`);
});
