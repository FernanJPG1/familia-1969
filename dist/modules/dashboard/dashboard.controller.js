"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardController = void 0;
const dashboard_service_1 = require("./dashboard.service");
class DashboardController {
    static getToday(req, res) {
        try {
            const queryDate = req.query?.date;
            const data = dashboard_service_1.DashboardService.getDashboardForDate(queryDate);
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
