import { DashboardService } from './dashboard.service';

export class DashboardController {
  public static getToday(req: any, res: any) {
    try {
      const queryDate = req.query?.date as string;
      const data = DashboardService.getDashboardForDate(queryDate);
      res.json(data);
    } catch (err: any) {
      console.error('Error cargando dashboard:', err);
      res.status(500).json({ error: err.message || 'Error cargando dashboard' });
    }
  }
}

export default DashboardController;
