import { SettingsService } from './settings.service';
import { eventBus } from '../../core/utils/events';

export class SettingsController {
  public static get(req: any, res: any) {
    res.json({ settings: SettingsService.get() });
  }

  public static update(req: any, res: any) {
    try {
      const updated = SettingsService.update(req.body);

      eventBus.emit('settings:updated', { settings: updated });
      eventBus.emit('dashboard:refresh');

      res.json({ success: true, settings: updated });
    } catch (err: any) {
      console.error('Error actualizando ajustes:', err);
      res.status(500).json({ error: err.message || 'Error actualizando ajustes' });
    }
  }
}

export default SettingsController;
