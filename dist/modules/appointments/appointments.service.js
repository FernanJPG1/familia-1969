"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppointmentsService = void 0;
const store_1 = require("../../database/store");
const availability_engine_1 = require("../availability/availability.engine");
const app_error_1 = require("../../core/errors/app-error");
class AppointmentsService {
    static async createManual(params) {
        const { serviceId, clientName, clientPhone, startTimeISO, notes } = params;
        const barber = store_1.store.getPrimaryBarber();
        const tenant = store_1.store.getPrimaryTenant();
        if (!serviceId || !clientName || !startTimeISO) {
            throw new app_error_1.BadRequestError('Faltan campos obligatorios (serviceId, clientName, startTimeISO)');
        }
        const service = store_1.store.findServiceById(serviceId);
        if (!service) {
            throw new app_error_1.NotFoundError('Servicio no encontrado');
        }
        const startTime = new Date(startTimeISO);
        const endTime = new Date(startTime.getTime() + service.durationMinutes * 60000);
        return await store_1.store.acquireLock(async () => {
            const isFree = availability_engine_1.availabilityEngine.isSlotFree({
                barberId: barber.id,
                startTime,
                endTime,
                existingAppointments: store_1.store.appointments,
                blocks: store_1.store.blocks,
            });
            if (!isFree) {
                throw new app_error_1.ConflictError('Ese horario ya no se encuentra libre para agendar');
            }
            const phone = clientPhone?.trim() || '573000000000';
            let client = store_1.store.findClientByPhone(phone);
            if (!client) {
                client = {
                    id: `client-${Date.now()}`,
                    tenantId: tenant.id,
                    name: clientName.trim(),
                    whatsappPhone: phone,
                    totalNoShows: 0,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                };
                store_1.store.clients.push(client);
            }
            const newAppointment = {
                id: `app-manual-${Date.now()}`,
                tenantId: tenant.id,
                barberId: barber.id,
                clientId: client.id,
                serviceId: service.id,
                startTime,
                endTime,
                totalPrice: service.price,
                status: 'confirmed',
                notes: notes || 'Agendado manualmente desde el panel del barbero',
                reminderSentAt: null,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            store_1.store.appointments.push(newAppointment);
            store_1.store.persist();
            return newAppointment;
        });
    }
    static updateStatus(id, status, notes) {
        const appItem = store_1.store.findAppointmentById(id);
        if (!appItem) {
            throw new app_error_1.NotFoundError('Cita no encontrada');
        }
        const validStatuses = ['pending', 'confirmed', 'arrived', 'completed', 'cancelled', 'no_show'];
        if (!validStatuses.includes(status)) {
            throw new app_error_1.BadRequestError(`Estado no válido. Estados permitidos: ${validStatuses.join(', ')}`);
        }
        appItem.status = status;
        if (notes !== undefined)
            appItem.notes = notes;
        appItem.updatedAt = new Date();
        if (status === 'no_show') {
            const client = store_1.store.clients.find((c) => c.id === appItem.clientId);
            if (client) {
                client.totalNoShows += 1;
            }
        }
        store_1.store.persist();
        return appItem;
    }
}
exports.AppointmentsService = AppointmentsService;
exports.default = AppointmentsService;
