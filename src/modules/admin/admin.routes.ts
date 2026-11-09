import { Router } from 'express';
import { AdminController } from './admin.controller';
import { requireAdmin } from '../../middlewares/auth.middleware';

const router = Router();

// Todas las rutas del panel de administración requieren privilegios de Administrador
router.use(requireAdmin);

router.get('/barbers', AdminController.listBarbers);
router.patch('/barbers/:id/status', AdminController.updateStatus);
router.patch('/barbers/:id', AdminController.updateDetails);
router.patch('/barbers/:id/membership', AdminController.updateMembership);
router.get('/memberships/stats', AdminController.getMembershipMetrics);
router.delete('/barbers/:id', AdminController.deleteBarber);
router.get('/stats', AdminController.getStats);

export default router;
