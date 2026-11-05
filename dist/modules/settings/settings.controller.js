"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsController = void 0;
const settings_service_1 = require("./settings.service");
const events_1 = require("../../core/utils/events");
class SettingsController {
    static get(req, res) {
        res.json({ settings: settings_service_1.SettingsService.get() });
    }
    static update(req, res) {
        try {
            const updated = settings_service_1.SettingsService.update(req.body);
            events_1.eventBus.emit('settings:updated', { settings: updated });
            events_1.eventBus.emit('dashboard:refresh');
            res.json({ success: true, settings: updated });
        }
        catch (err) {
            console.error('Error actualizando ajustes:', err);
            res.status(500).json({ error: err.message || 'Error actualizando ajustes' });
        }
    }
}
exports.SettingsController = SettingsController;
exports.default = SettingsController;
