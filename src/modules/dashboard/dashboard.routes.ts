import { Router } from 'express';
import { DashboardController } from './dashboard.controller';

const router = Router();

router.get('/today', DashboardController.getToday);

export default router;
