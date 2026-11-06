"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dashboard_controller_1 = require("./dashboard.controller");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.get('/today', auth_middleware_1.optionalAuth, dashboard_controller_1.DashboardController.getToday);
exports.default = router;
