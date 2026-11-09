import { Router } from 'express';
import { AuthController } from './auth.controller';
import { requireAuth } from '../../middlewares/auth.middleware';

const router = Router();

router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/verify', AuthController.verify);
router.post('/resend-code', AuthController.resendCode);
router.get('/me', requireAuth, AuthController.getMe);
router.patch('/me', requireAuth, AuthController.updateMe);

export default router;
