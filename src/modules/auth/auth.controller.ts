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
      res.status(401).json({ error: error.message || 'Error al iniciar sesión.' });
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
