import { Router } from 'express';
import { DashboardController } from './dashboard.controller';
import { optionalAuth } from '../../middlewares/auth.middleware';

const router = Router();

router.get('/today', optionalAuth, DashboardController.getToday);

export default router;
