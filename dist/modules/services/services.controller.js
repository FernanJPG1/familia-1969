"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServicesController = void 0;
const services_service_1 = require("./services.service");
const events_1 = require("../../core/utils/events");
class ServicesController {
    static getAll(req, res) {
        try {
            const includeAll = req.query.all === 'true' || req.query.includeInactive === 'true';
            const services = services_service_1.ServicesService.getAll(includeAll);
            res.json({ services });
        }
        catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
    static getById(req, res) {
        try {
            const service = services_service_1.ServicesService.getById(req.params.id);
            res.json({ service });
        }
        catch (err) {
            res.status(err.statusCode || 404).json({ error: err.message });
        }
    }
    static create(req, res) {
        try {
            const { name, durationMinutes, price, description, category, badge, icon } = req.body;
            const service = services_service_1.ServicesService.create({
                name,
                durationMinutes,
                price,
                description,
                category,
                badge,
                icon,
            });
            events_1.eventBus.emit('services:updated', { service, action: 'created' });
            events_1.eventBus.emit('dashboard:refresh');
            res.status(201).json({ success: true, service });
        }
        catch (err) {
            res.status(err.statusCode || 400).json({ error: err.message });
        }
    }
    static update(req, res) {
        try {
            const { id } = req.params;
            const service = services_service_1.ServicesService.update(id, req.body);
            events_1.eventBus.emit('services:updated', { service, action: 'updated' });
            events_1.eventBus.emit('dashboard:refresh');
            res.json({ success: true, service });
        }
        catch (err) {
            res.status(err.statusCode || 400).json({ error: err.message });
        }
    }
    static toggle(req, res) {
        try {
            const { id } = req.params;
            const service = services_service_1.ServicesService.toggle(id);
            events_1.eventBus.emit('services:updated', { service, action: 'toggled' });
            events_1.eventBus.emit('dashboard:refresh');
            res.json({ success: true, service });
        }
        catch (err) {
            res.status(err.statusCode || 404).json({ error: err.message });
        }
    }
    static delete(req, res) {
        try {
            const { id } = req.params;
            services_service_1.ServicesService.delete(id);
            events_1.eventBus.emit('services:updated', { deletedId: id, action: 'deleted' });
            events_1.eventBus.emit('dashboard:refresh');
            res.json({ success: true, message: 'Servicio eliminado con éxito' });
        }
        catch (err) {
            res.status(err.statusCode || 404).json({ error: err.message });
        }
    }
}
exports.ServicesController = ServicesController;
exports.default = ServicesController;
