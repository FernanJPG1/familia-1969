import { Router } from 'express';
import { AuthController } from './auth.controller';
import { requireAuth } from '../../middlewares/auth.middleware';
import { createRateLimiter } from '../../middlewares/security.middleware';

const router = Router();

const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutos
  maxRequests: 20,
  message: 'Demasiados intentos de autenticación. Por seguridad, espera 15 minutos.',
});

router.post('/register', authRateLimiter, AuthController.register);
router.post('/login', authRateLimiter, AuthController.login);
router.post('/verify', authRateLimiter, AuthController.verify);
router.post('/resend-code', authRateLimiter, AuthController.resendCode);
router.get('/me', requireAuth, AuthController.getMe);
router.patch('/me', requireAuth, AuthController.updateMe);

export default router;
