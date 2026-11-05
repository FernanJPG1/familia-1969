import { whatsappService } from './whatsapp.service';
import { env } from '../../config/env';
import { eventBus } from '../../core/utils/events';

export class WhatsAppController {
  public static async simulate(req: any, res: any) {
    try {
      const { from = '573001234567', type = 'text', text, buttonId, listId } = req.body;
      const tenantId = env.DEFAULT_TENANT_ID;

      const response = await whatsappService.handleIncomingMessage(tenantId, {
        from,
        type,
        text,
        buttonId,
        listId,
      });

      eventBus.emit('dashboard:refresh');
      res.json(response);
    } catch (error: any) {
      console.error('Error en simulación WhatsApp:', error);
      res.status(500).json({ error: error.message });
    }
  }

  public static verifyWebhook(req: any, res: any) {
    const mode = req.query?.['hub.mode'];
    const token = req.query?.['hub.verify_token'];
    const challenge = req.query?.['hub.challenge'];

    if (mode === 'subscribe' && token === env.META_WA_VERIFY_TOKEN) {
      return res.status(200).send(challenge);
    }
    return res.status(403).send('Forbidden');
  }

  public static async handleWebhook(req: any, res: any) {
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
        let type: 'text' | 'interactive_button' | 'interactive_list' = 'text';

        if (message.type === 'text') {
          text = message.text?.body;
        } else if (message.type === 'interactive') {
          if (message.interactive.type === 'button_reply') {
            type = 'interactive_button';
            buttonId = message.interactive.button_reply.id;
          } else if (message.interactive.type === 'list_reply') {
            type = 'interactive_list';
            listId = message.interactive.list_reply.id;
          }
        }

        await whatsappService.handleIncomingMessage(env.DEFAULT_TENANT_ID, {
          from,
          type,
          text,
          buttonId,
          listId,
        });

        eventBus.emit('dashboard:refresh');
      }

      res.status(200).send('EVENT_RECEIVED');
    } catch (err) {
      console.error('Error procesando webhook Meta:', err);
      res.status(500).send('ERROR');
    }
  }
}

export default WhatsAppController;
