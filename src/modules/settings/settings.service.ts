import { store } from '../../database/store';
import { BarberSettings } from '../../core/types';

export class SettingsService {
  public static get(): BarberSettings {
    return store.settings;
  }

  public static update(partial: Partial<BarberSettings>): BarberSettings {
    return store.updateSettings(partial);
  }
}

export default SettingsService;
