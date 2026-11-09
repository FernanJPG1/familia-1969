import { AuthService } from './auth.service';
import { eventBus } from '../../core/utils/events';

export class AuthController {
  public static async register(req: any, res: any) {
    try {
      const response = await AuthService.register(req.body);
      eventBus.emit('dashboard:refresh');
      res.status(201).json(response);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Error en el registro.' });
    }
  }

  public static async login(req: any, res: any) {
    try {
      const response = await AuthService.login(req.body);
      res.status(200).json(response);
    } catch (error: any) {
      const status = error.statusCode || 401;
      res.status(status).json({ 
        error: error.message || 'Error al iniciar sesión.',
        isPending: Boolean(error.isPending),
        requiresVerification: Boolean(error.requiresVerification),
        userId: error.userId,
        email: error.email,
        phone: error.phone,
        emailCodePreview: error.emailCodePreview,
        phoneCodePreview: error.phoneCodePreview
      });
    }
  }

  public static async verify(req: any, res: any) {
    try {
      const response = await AuthService.verify(req.body);
      eventBus.emit('dashboard:refresh');
      res.status(200).json(response);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Error en la verificación.' });
    }
  }

  public static async resendCode(req: any, res: any) {
    try {
      const response = await AuthService.resendCode(req.body);
      res.status(200).json(response);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Error al reenviar códigos.' });
    }
  }

  public static getMe(req: any, res: any) {
    try {
      const profile = AuthService.getProfile(req.user.userId);
      res.status(200).json({ user: profile });
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  }

  public static updateMe(req: any, res: any) {
    try {
      const updated = AuthService.updateProfile(req.user.userId, req.body);
      eventBus.emit('settings:updated', { settings: { phone: updated.phone } });
      eventBus.emit('dashboard:refresh');
      res.status(200).json({ success: true, user: updated });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}

export default AuthController;
