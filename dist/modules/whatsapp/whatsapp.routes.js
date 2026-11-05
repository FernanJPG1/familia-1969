"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const whatsapp_controller_1 = require("./whatsapp.controller");
const router = (0, express_1.Router)();
router.post('/simulate', whatsapp_controller_1.WhatsAppController.simulate);
router.get('/webhook', whatsapp_controller_1.WhatsAppController.verifyWebhook);
router.post('/webhook', whatsapp_controller_1.WhatsAppController.handleWebhook);
exports.default = router;
