"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardController = void 0;
const dashboard_service_1 = require("./dashboard.service");
function maskSensitivePhone(phone) {
    if (!phone)
        return 'Protegido';
    const clean = phone.trim();
    if (clean.length <= 4)
        return '****';
    const start = clean.substring(0, Math.min(4, Math.floor(clean.length / 2)));
    const end = clean.slice(-2);
    return `${start}******${end}`;
}
class DashboardController {
    static getToday(req, res) {
        try {
            const queryDate = req.query?.date;
            const data = dashboard_service_1.DashboardService.getDashboardForDate(queryDate);
            // Protección de privacidad: si no es el barbero autenticado, anonimizar datos sensibles
            if (!req.user) {
                data.appointments = data.appointments.map((a) => ({
                    ...a,
                    clientPhone: maskSensitivePhone(a.clientPhone),
                    totalPrice: 0,
                    commissionAmount: 0,
                    notes: null
                }));
                data.metrics = {
                    ...data.metrics,
                    totalRevenue: 0,
                    myEarnings: 0
                };
                data.isGuest = true;
            }
            else {
                data.isGuest = false;
                data.authenticatedUser = req.user;
            }
            res.json(data);
        }
        catch (err) {
            console.error('Error cargando dashboard:', err);
            res.status(500).json({ error: err.message || 'Error cargando dashboard' });
        }
    }
}
exports.DashboardController = DashboardController;
exports.default = DashboardController;
