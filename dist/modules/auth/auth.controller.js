"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const auth_service_1 = require("./auth.service");
const events_1 = require("../../core/utils/events");
class AuthController {
    static async register(req, res) {
        try {
            const response = await auth_service_1.AuthService.register(req.body);
            events_1.eventBus.emit('dashboard:refresh');
            res.status(201).json(response);
        }
        catch (error) {
            res.status(400).json({ error: error.message || 'Error en el registro.' });
        }
    }
    static async login(req, res) {
        try {
            const response = await auth_service_1.AuthService.login(req.body);
            res.status(200).json(response);
        }
        catch (error) {
            res.status(401).json({ error: error.message || 'Error al iniciar sesión.' });
        }
    }
    static getMe(req, res) {
        try {
            const profile = auth_service_1.AuthService.getProfile(req.user.userId);
            res.status(200).json({ user: profile });
        }
        catch (error) {
            res.status(404).json({ error: error.message });
        }
    }
    static updateMe(req, res) {
        try {
            const updated = auth_service_1.AuthService.updateProfile(req.user.userId, req.body);
            events_1.eventBus.emit('settings:updated', { settings: { phone: updated.phone } });
            events_1.eventBus.emit('dashboard:refresh');
            res.status(200).json({ success: true, user: updated });
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
}
exports.AuthController = AuthController;
exports.default = AuthController;
