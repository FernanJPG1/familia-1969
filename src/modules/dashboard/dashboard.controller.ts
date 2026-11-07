import { DashboardService } from './dashboard.service';

function maskSensitivePhone(phone: string): string {
  if (!phone) return 'Protegido';
  const clean = phone.trim();
  if (clean.length <= 4) return '****';
  const start = clean.substring(0, Math.min(4, Math.floor(clean.length / 2)));
  const end = clean.slice(-2);
  return `${start}******${end}`;
}

export class DashboardController {
  public static getToday(req: any, res: any) {
    try {
      const queryDate = req.query?.date as string;
      const queryBarberId = req.query?.barberId as string;
      const filterBarberId = (req.user?.role === 'barber' && !queryBarberId) ? req.user.barberId : queryBarberId;

      const data = DashboardService.getDashboardForDate(queryDate, filterBarberId);

      // Protección de privacidad: si no es el barbero o admin autenticado, anonimizar datos sensibles
      if (!req.user) {
        data.appointments = data.appointments.map((a: any) => ({
          ...a,
          clientPhone: maskSensitivePhone(a.clientPhone),
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
        (data as any).isAdmin = req.user.role === 'admin';
      }

      res.json(data);
    } catch (err: any) {
      console.error('Error cargando dashboard:', err);
      res.status(500).json({ error: err.message || 'Error cargando dashboard' });
    }
  }
}

export default DashboardController;
