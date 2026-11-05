import { Router } from 'express';
import { AvailabilityController } from './availability.controller';

const router = Router();

router.get('/', AvailabilityController.getAvailability);

export default router;
