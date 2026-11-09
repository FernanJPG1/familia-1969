"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminController = void 0;
const admin_service_1 = require("./admin.service");
const events_1 = require("../../core/utils/events");
class AdminController {
    static listBarbers(req, res) {
        try {
            const barbers = admin_service_1.AdminService.listBarbers();
            res.json({ barbers });
        }
        catch (error) {
            res.status(500).json({ error: error.message || 'Error listando barberos' });
        }
    }
    static updateStatus(req, res) {
        try {
            const { id } = req.params;
            const { status, isActive } = req.body;
            if (!status && typeof isActive !== 'boolean') {
                return res.status(400).json({ error: 'Debes proporcionar status ("active" | "suspended" | "pending") o isActive (boolean).' });
            }
            const newStatus = status || (isActive ? 'active' : 'suspended');
            const newIsActive = typeof isActive === 'boolean' ? isActive : newStatus === 'active';
            const result = admin_service_1.AdminService.updateBarberStatus(id, newStatus, newIsActive, req.user);
            events_1.eventBus.emit('dashboard:refresh');
            res.json(result);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    static updateDetails(req, res) {
        try {
            const { id } = req.params;
            const result = admin_service_1.AdminService.updateBarberDetails(id, req.body);
            events_1.eventBus.emit('dashboard:refresh');
            res.json(result);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    static updateMembership(req, res) {
        try {
            const { id } = req.params;
            const result = admin_service_1.AdminService.updateBarberMembership(id, req.body);
            events_1.eventBus.emit('dashboard:refresh');
            res.json(result);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    static getMembershipMetrics(req, res) {
        try {
            const stats = admin_service_1.AdminService.getAdminStats();
            res.json({
                memberships: stats.memberships,
                barbers: admin_service_1.AdminService.listBarbers()
            });
        }
        catch (error) {
            res.status(500).json({ error: error.message || 'Error obteniendo métricas de membresías' });
        }
    }
    static deleteBarber(req, res) {
        try {
            const { id } = req.params;
            const result = admin_service_1.AdminService.deleteBarber(id);
            events_1.eventBus.emit('dashboard:refresh');
            res.json(result);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    static getStats(req, res) {
        try {
            const stats = admin_service_1.AdminService.getAdminStats();
            res.json(stats);
        }
        catch (error) {
            res.status(500).json({ error: error.message || 'Error obteniendo estadísticas' });
        }
    }
}
exports.AdminController = AdminController;
exports.default = AdminController;
