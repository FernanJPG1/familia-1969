"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const settings_controller_1 = require("./settings.controller");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.get('/', settings_controller_1.SettingsController.get);
router.put('/', auth_middleware_1.requireAuth, settings_controller_1.SettingsController.update);
exports.default = router;
