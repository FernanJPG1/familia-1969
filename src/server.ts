import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { createApp } from './app';
import { env } from './config/env';
import { store } from './database/store';
import { eventBus } from './core/utils/events';
import { ReminderScheduler } from './modules/appointments/reminder.scheduler';

const app = createApp();
const server = http.createServer(app);

// Inicializar Socket.IO para sincronización en tiempo real
const io = new SocketIOServer(server, {
  cors: { origin: '*' },
});

// Conectar eventBus con la instancia de Socket.IO
eventBus.setIO(io);

io.on('connection', (socket: any) => {
  // Conexión cliente activa
  socket.on('disconnect', () => {});
});

// Iniciar servidor HTTP
server.listen(env.PORT, () => {
  const barber = store.getPrimaryBarber();
  console.log(`\n======================================================`);
  console.log(`💈 BARBERÍA APP - 1 SOLO BARBERO PRO`);
  console.log(`👤 Propietario / Barbero: ${barber?.name}`);
  console.log(`✂️ Catálogo Dinámico de Servicios: Activo (${store.services.length} cortes)`);
  console.log(`🤖 WhatsApp Bot con NLU & Horarios: Operativo`);
  console.log(`🕒 Zona Horaria de Atención: America/Bogota`);
  console.log(`🚀 Servidor listo en: http://localhost:${env.PORT}`);
  console.log(`======================================================\n`);

  // Iniciar scheduler de recordatorios automáticos (20 minutos antes de cada cita)
  ReminderScheduler.start();
});

// Manejo de apagado controlado
const shutdown = () => {
  console.log('\n🛑 Cerrando servidor de Barbería de forma ordenada...');
  ReminderScheduler.stop();
  server.close(() => {
    console.log('✅ Servidor cerrado.');
    process.exit(0);
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
