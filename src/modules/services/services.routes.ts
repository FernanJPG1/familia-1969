import { Router } from 'express';
import { ServicesController } from './services.controller';

const router = Router();

router.get('/', ServicesController.getAll);
router.get('/:id', ServicesController.getById);
router.post('/', ServicesController.create);
router.put('/:id', ServicesController.update);
router.patch('/:id/toggle', ServicesController.toggle);
router.delete('/:id', ServicesController.delete);

export default router;
