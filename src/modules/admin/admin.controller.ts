import { AdminService } from './admin.service';
import { eventBus } from '../../core/utils/events';

export class AdminController {
  public static listBarbers(req: any, res: any) {
    try {
      const barbers = AdminService.listBarbers();
      res.json({ barbers });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Error listando barberos' });
    }
  }

  public static updateStatus(req: any, res: any) {
    try {
      const { id } = req.params;
      const { status, isActive } = req.body;

      if (!status && typeof isActive !== 'boolean') {
        return res.status(400).json({ error: 'Debes proporcionar status ("active" | "suspended" | "pending") o isActive (boolean).' });
      }

      const newStatus = status || (isActive ? 'active' : 'suspended');
      const newIsActive = typeof isActive === 'boolean' ? isActive : newStatus === 'active';

      const result = AdminService.updateBarberStatus(id, newStatus, newIsActive, req.user);
      eventBus.emit('dashboard:refresh');
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  public static updateDetails(req: any, res: any) {
    try {
      const { id } = req.params;
      const result = AdminService.updateBarberDetails(id, req.body);
      eventBus.emit('dashboard:refresh');
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

    public static updateMembership(req: any, res: any) {
    try {
      const { id } = req.params;
      const result = AdminService.updateBarberMembership(id, req.body);
      eventBus.emit('dashboard:refresh');
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  public static getMembershipMetrics(req: any, res: any) {
    try {
      const stats = AdminService.getAdminStats();
      res.json({
        memberships: stats.memberships,
        barbers: AdminService.listBarbers()
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Error obteniendo métricas de membresías' });
    }
  }

  public static deleteBarber(req: any, res: any) {
    try {
      const { id } = req.params;
      const result = AdminService.deleteBarber(id);
      eventBus.emit('dashboard:refresh');
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  public static getStats(req: any, res: any) {
    try {
      const stats = AdminService.getAdminStats();
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Error obteniendo estadísticas' });
    }
  }
}

export default AdminController;
