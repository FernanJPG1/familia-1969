"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServicesService = void 0;
const store_1 = require("../../database/store");
const app_error_1 = require("../../core/errors/app-error");
class ServicesService {
    static getAll(includeInactive = false) {
        if (includeInactive) {
            return [...store_1.store.services];
        }
        return store_1.store.services.filter((s) => s.isActive);
    }
    static getAllActive() {
        return store_1.store.services.filter((s) => s.isActive);
    }
    static getById(id) {
        const srv = store_1.store.findServiceById(id);
        if (!srv) {
            throw new app_error_1.NotFoundError(`Servicio con ID ${id} no encontrado`);
        }
        return srv;
    }
    static create(data) {
        const { name, durationMinutes, price, description, category, badge, icon } = data;
        if (!name || !name.trim()) {
            throw new app_error_1.BadRequestError('El nombre del corte es obligatorio');
        }
        const dur = Number(durationMinutes);
        if (isNaN(dur) || dur < 5 || dur > 360) {
            throw new app_error_1.BadRequestError('La duración debe ser un número entre 5 y 360 minutos');
        }
        const prc = Number(price);
        if (isNaN(prc) || prc < 0) {
            throw new app_error_1.BadRequestError('El precio debe ser un número válido mayor o igual a 0');
        }
        const newService = {
            id: `srv-${Date.now()}`,
            tenantId: store_1.store.getPrimaryTenant().id,
            name: name.trim(),
            description: description ? description.trim() : '',
            category: category ? category.trim() : 'Corte',
            badge: badge ? badge.trim() : undefined,
            icon: icon ? icon.trim() : 'fa-scissors',
            durationMinutes: dur,
            price: prc,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        store_1.store.services.push(newService);
        store_1.store.persist();
        return newService;
    }
    static update(id, data) {
        const srv = store_1.store.findServiceById(id);
        if (!srv) {
            throw new app_error_1.NotFoundError(`Servicio con ID ${id} no encontrado`);
        }
        if (data.name !== undefined) {
            if (!data.name.trim())
                throw new app_error_1.BadRequestError('El nombre no puede estar vacío');
            srv.name = data.name.trim();
        }
        if (data.durationMinutes !== undefined) {
            const dur = Number(data.durationMinutes);
            if (isNaN(dur) || dur < 5)
                throw new app_error_1.BadRequestError('Duración inválida');
            srv.durationMinutes = dur;
        }
        if (data.price !== undefined) {
            const prc = Number(data.price);
            if (isNaN(prc) || prc < 0)
                throw new app_error_1.BadRequestError('Precio inválido');
            srv.price = prc;
        }
        if (data.description !== undefined) {
            srv.description = data.description.trim();
        }
        if (data.category !== undefined) {
            srv.category = data.category.trim();
        }
        if (data.badge !== undefined) {
            srv.badge = data.badge ? data.badge.trim() : undefined;
        }
        if (data.icon !== undefined) {
            srv.icon = data.icon.trim();
        }
        if (data.isActive !== undefined) {
            srv.isActive = Boolean(data.isActive);
        }
        srv.updatedAt = new Date();
        store_1.store.persist();
        return srv;
    }
    static toggle(id) {
        const srv = store_1.store.findServiceById(id);
        if (!srv) {
            throw new app_error_1.NotFoundError(`Servicio con ID ${id} no encontrado`);
        }
        srv.isActive = !srv.isActive;
        srv.updatedAt = new Date();
        store_1.store.persist();
        return srv;
    }
    static delete(id) {
        const srv = store_1.store.findServiceById(id);
        if (!srv) {
            throw new app_error_1.NotFoundError('Servicio no encontrado');
        }
        srv.isActive = false;
        srv.updatedAt = new Date();
        store_1.store.persist();
        return true;
    }
}
exports.ServicesService = ServicesService;
exports.default = ServicesService;
