import { Router } from 'express';
import { SettingsController } from './settings.controller';
import { requireAuth } from '../../middlewares/auth.middleware';

const router = Router();

router.get('/', SettingsController.get);
router.put('/', requireAuth, SettingsController.update);

export default router;
