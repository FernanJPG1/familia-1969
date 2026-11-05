"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AvailabilityController = void 0;
const store_1 = require("../../database/store");
const availability_engine_1 = require("./availability.engine");
const datetime_utils_1 = require("../../core/utils/datetime.utils");
class AvailabilityController {
    static getAvailability(req, res) {
        try {
            const { serviceId, date } = req.query;
            const targetDate = date || datetime_utils_1.DateTimeUtils.getTodayDateString();
            const barber = store_1.store.getPrimaryBarber();
            if (!serviceId) {
                return res.status(400).json({ error: 'serviceId es requerido' });
            }
            const service = store_1.store.findServiceById(serviceId);
            if (!service) {
                return res.status(404).json({ error: 'Servicio no encontrado' });
            }
            const slots = availability_engine_1.availabilityEngine.calculateSlotsForBarber({
                barber,
                service,
                date: targetDate,
                schedules: store_1.store.schedules,
                blocks: store_1.store.blocks,
                existingAppointments: store_1.store.appointments,
                slotBufferMinutes: store_1.store.settings.slotBufferMinutes,
            });
            const freeSlots = slots.filter((s) => s.available);
            return res.json({
                date: targetDate,
                service,
                barber: { id: barber.id, name: barber.name, colorTag: barber.colorTag },
                slots,
                freeSlotsCount: freeSlots.length,
                totalGeneratedSlots: slots.length,
            });
        }
        catch (err) {
            console.error('Error calculando disponibilidad:', err);
            return res.status(500).json({ error: err.message || 'Error interno al calcular disponibilidad' });
        }
    }
}
exports.AvailabilityController = AvailabilityController;
exports.default = AvailabilityController;
