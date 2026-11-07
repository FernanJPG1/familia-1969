"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const store_1 = require("../database/store");
const services_routes_1 = __importDefault(require("../modules/services/services.routes"));
const settings_routes_1 = __importDefault(require("../modules/settings/settings.routes"));
const dashboard_routes_1 = __importDefault(require("../modules/dashboard/dashboard.routes"));
const appointments_routes_1 = __importDefault(require("../modules/appointments/appointments.routes"));
const availability_routes_1 = __importDefault(require("../modules/availability/availability.routes"));
const whatsapp_routes_1 = __importDefault(require("../modules/whatsapp/whatsapp.routes"));
const auth_routes_1 = __importDefault(require("../modules/auth/auth.routes"));
const admin_routes_1 = __importDefault(require("../modules/admin/admin.routes"));
const router = (0, express_1.Router)();
// Health check & Server Status
router.get('/health', (req, res) => {
    const barber = store_1.store.getPrimaryBarber();
    res.json({
        status: 'online',
        timestamp: new Date().toISOString(),
        service: 'Barberia Pro API & WhatsApp Bot',
        barber: barber?.name,
        activeAppointments: store_1.store.appointments.length,
        servicesCount: store_1.store.services.length,
        activeBarbersCount: store_1.store.getActiveBarbers().length,
    });
});
// Endpoint público para obtener la lista de barberos activos disponibles para agendar
router.get('/barbers/active', (req, res) => {
    const activeBarbers = store_1.store.getActiveBarbers().map(b => ({
        id: b.id,
        name: b.name,
        colorTag: b.colorTag,
        phone: b.phone
    }));
    res.json({ barbers: activeBarbers });
});
// Registrar módulos
router.use('/auth', auth_routes_1.default);
router.use('/admin', admin_routes_1.default);
router.use('/services', services_routes_1.default);
router.use('/settings', settings_routes_1.default);
router.use('/dashboard', dashboard_routes_1.default);
router.use('/appointments', appointments_routes_1.default);
router.use('/availability', availability_routes_1.default);
router.use('/whatsapp', whatsapp_routes_1.default);
exports.default = router;
