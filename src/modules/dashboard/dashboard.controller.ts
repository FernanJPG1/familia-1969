import { DashboardService } from './dashboard.service';

export class DashboardController {
  public static getToday(req: any, res: any) {
    try {
      const queryDate = req.query?.date as string;
      const data = DashboardService.getDashboardForDate(queryDate);

      // Protección de privacidad: si no es el barbero autenticado, anonimizar datos sensibles
      if (!req.user) {
        data.appointments = data.appointments.map((a: any) => ({
          ...a,
          clientPhone: a.clientPhone ? a.clientPhone.replace(/(\+\d{2}\s?\d{3})\d{4,}(\d{2})/, '$1****$2') : 'Protegido',
          totalPrice: 0,
          commissionAmount: 0,
          notes: null
        }));

        data.metrics = {
          ...data.metrics,
          totalRevenue: 0,
          myEarnings: 0
        };

        (data as any).isGuest = true;
      } else {
        (data as any).isGuest = false;
        (data as any).authenticatedUser = req.user;
      }

      res.json(data);
    } catch (err: any) {
      console.error('Error cargando dashboard:', err);
      res.status(500).json({ error: err.message || 'Error cargando dashboard' });
    }
  }
}

export default DashboardController;
