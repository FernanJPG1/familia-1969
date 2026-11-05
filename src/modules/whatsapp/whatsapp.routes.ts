import { Router } from 'express';
import { WhatsAppController } from './whatsapp.controller';

const router = Router();

router.post('/simulate', WhatsAppController.simulate);
router.get('/webhook', WhatsAppController.verifyWebhook);
router.post('/webhook', WhatsAppController.handleWebhook);

export default router;
