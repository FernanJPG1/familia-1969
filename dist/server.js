"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const app_1 = require("./app");
const env_1 = require("./config/env");
const store_1 = require("./database/store");
const events_1 = require("./core/utils/events");
const reminder_scheduler_1 = require("./modules/appointments/reminder.scheduler");
const app = (0, app_1.createApp)();
const server = http_1.default.createServer(app);
// Inicializar Socket.IO para sincronización en tiempo real
const io = new socket_io_1.Server(server, {
    cors: { origin: '*' },
});
// Conectar eventBus con la instancia de Socket.IO
events_1.eventBus.setIO(io);
io.on('connection', (socket) => {
    // Conexión cliente activa
    socket.on('disconnect', () => { });
});
// Iniciar servidor HTTP
server.listen(env_1.env.PORT, () => {
    const barber = store_1.store.getPrimaryBarber();
    console.log(`\n======================================================`);
    console.log(`💈 BARBERÍA APP - 1 SOLO BARBERO PRO`);
    console.log(`👤 Propietario / Barbero: ${barber?.name}`);
    console.log(`✂️ Catálogo Dinámico de Servicios: Activo (${store_1.store.services.length} cortes)`);
    console.log(`🤖 WhatsApp Bot con NLU & Horarios: Operativo`);
    console.log(`🕒 Zona Horaria de Atención: America/Bogota`);
    console.log(`🚀 Servidor listo en: http://localhost:${env_1.env.PORT}`);
    console.log(`======================================================\n`);
    // Iniciar scheduler de recordatorios automáticos (20 minutos antes de cada cita)
    reminder_scheduler_1.ReminderScheduler.start();
});
// Manejo de apagado controlado
const shutdown = () => {
    console.log('\n🛑 Cerrando servidor de Barbería de forma ordenada...');
    reminder_scheduler_1.ReminderScheduler.stop();
    server.close(() => {
        console.log('✅ Servidor cerrado.');
        process.exit(0);
    });
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
