import { ServicesService } from './services.service';
import { eventBus } from '../../core/utils/events';

export class ServicesController {
  public static getAll(req: any, res: any) {
    try {
      const includeAll = req.query.all === 'true' || req.query.includeInactive === 'true';
      const services = ServicesService.getAll(includeAll);
      res.json({ services });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  public static getById(req: any, res: any) {
    try {
      const service = ServicesService.getById(req.params.id);
      res.json({ service });
    } catch (err: any) {
      res.status(err.statusCode || 404).json({ error: err.message });
    }
  }

  public static create(req: any, res: any) {
    try {
      const { name, durationMinutes, price, description, category, badge, icon } = req.body;
      const service = ServicesService.create({
        name,
        durationMinutes,
        price,
        description,
        category,
        badge,
        icon,
      });

      eventBus.emit('services:updated', { service, action: 'created' });
      eventBus.emit('dashboard:refresh');

      res.status(201).json({ success: true, service });
    } catch (err: any) {
      res.status(err.statusCode || 400).json({ error: err.message });
    }
  }

  public static update(req: any, res: any) {
    try {
      const { id } = req.params;
      const service = ServicesService.update(id, req.body);

      eventBus.emit('services:updated', { service, action: 'updated' });
      eventBus.emit('dashboard:refresh');

      res.json({ success: true, service });
    } catch (err: any) {
      res.status(err.statusCode || 400).json({ error: err.message });
    }
  }

  public static toggle(req: any, res: any) {
    try {
      const { id } = req.params;
      const service = ServicesService.toggle(id);

      eventBus.emit('services:updated', { service, action: 'toggled' });
      eventBus.emit('dashboard:refresh');

      res.json({ success: true, service });
    } catch (err: any) {
      res.status(err.statusCode || 404).json({ error: err.message });
    }
  }

  public static delete(req: any, res: any) {
    try {
      const { id } = req.params;
      ServicesService.delete(id);

      eventBus.emit('services:updated', { deletedId: id, action: 'deleted' });
      eventBus.emit('dashboard:refresh');

      res.json({ success: true, message: 'Servicio eliminado con éxito' });
    } catch (err: any) {
      res.status(err.statusCode || 404).json({ error: err.message });
    }
  }
}

export default ServicesController;
