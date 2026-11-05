import { Router } from 'express';
import { AppointmentsController } from './appointments.controller';

const router = Router();

router.post('/', AppointmentsController.create);
router.post('/:id/status', AppointmentsController.updateStatus);
router.post('/:id/trigger-reminder', AppointmentsController.triggerReminder);

export default router;
