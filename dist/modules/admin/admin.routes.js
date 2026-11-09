"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_controller_1 = require("./admin.controller");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// Todas las rutas del panel de administración requieren privilegios de Administrador
router.use(auth_middleware_1.requireAdmin);
router.get('/barbers', admin_controller_1.AdminController.listBarbers);
router.patch('/barbers/:id/status', admin_controller_1.AdminController.updateStatus);
router.patch('/barbers/:id', admin_controller_1.AdminController.updateDetails);
router.patch('/barbers/:id/membership', admin_controller_1.AdminController.updateMembership);
router.get('/memberships/stats', admin_controller_1.AdminController.getMembershipMetrics);
router.delete('/barbers/:id', admin_controller_1.AdminController.deleteBarber);
router.get('/stats', admin_controller_1.AdminController.getStats);
exports.default = router;
