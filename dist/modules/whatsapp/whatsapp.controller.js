"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsAppController = void 0;
const whatsapp_service_1 = require("./whatsapp.service");
const env_1 = require("../../config/env");
const events_1 = require("../../core/utils/events");
class WhatsAppController {
    static async simulate(req, res) {
        try {
            const { from = '573001234567', type = 'text', text, buttonId, listId } = req.body;
            const tenantId = env_1.env.DEFAULT_TENANT_ID;
            const response = await whatsapp_service_1.whatsappService.handleIncomingMessage(tenantId, {
                from,
                type,
                text,
                buttonId,
                listId,
            });
            events_1.eventBus.emit('dashboard:refresh');
            res.json(response);
        }
        catch (error) {
            console.error('Error en simulación WhatsApp:', error);
            res.status(500).json({ error: error.message });
        }
    }
    static verifyWebhook(req, res) {
        const mode = req.query?.['hub.mode'];
        const token = req.query?.['hub.verify_token'];
        const challenge = req.query?.['hub.challenge'];
        if (mode === 'subscribe' && token === env_1.env.META_WA_VERIFY_TOKEN) {
            return res.status(200).send(challenge);
        }
        return res.status(403).send('Forbidden');
    }
    static async handleWebhook(req, res) {
        try {
            const body = req.body;
            const entry = body?.entry?.[0];
            const changes = entry?.changes?.[0];
            const value = changes?.value;
            const message = value?.messages?.[0];
            if (message) {
                const from = message.from;
                let text = '';
                let buttonId = '';
                let listId = '';
                let type = 'text';
                if (message.type === 'text') {
                    text = message.text?.body;
                }
                else if (message.type === 'interactive') {
                    if (message.interactive.type === 'button_reply') {
                        type = 'interactive_button';
                        buttonId = message.interactive.button_reply.id;
                    }
                    else if (message.interactive.type === 'list_reply') {
                        type = 'interactive_list';
                        listId = message.interactive.list_reply.id;
                    }
                }
                await whatsapp_service_1.whatsappService.handleIncomingMessage(env_1.env.DEFAULT_TENANT_ID, {
                    from,
                    type,
                    text,
                    buttonId,
                    listId,
                });
                events_1.eventBus.emit('dashboard:refresh');
            }
            res.status(200).send('EVENT_RECEIVED');
        }
        catch (err) {
            console.error('Error procesando webhook Meta:', err);
            res.status(500).send('ERROR');
        }
    }
}
exports.WhatsAppController = WhatsAppController;
exports.default = WhatsAppController;
