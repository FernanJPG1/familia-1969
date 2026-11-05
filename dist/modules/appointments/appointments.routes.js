"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const appointments_controller_1 = require("./appointments.controller");
const router = (0, express_1.Router)();
router.post('/', appointments_controller_1.AppointmentsController.create);
router.post('/:id/status', appointments_controller_1.AppointmentsController.updateStatus);
router.post('/:id/trigger-reminder', appointments_controller_1.AppointmentsController.triggerReminder);
exports.default = router;
