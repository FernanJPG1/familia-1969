import { store } from '../../database/store';
import { DateTimeUtils } from '../../core/utils/datetime.utils';

export class DashboardService {
  public static getDashboardForDate(queryDate?: string) {
    const date = queryDate || DateTimeUtils.getTodayDateString();
    const tenant = store.getPrimaryTenant();
    const barber = store.getPrimaryBarber();
    const services = store.services.filter((s) => s.isActive);

    // Obtener citas del día usando DateTimeUtils exacto
    const appointmentsForDate = store.appointments
      .filter((a) => {
        const aDate = DateTimeUtils.extractDateAndTime(a.startTime).dateStr;
        return aDate === date;
      })
      .map((a) => {
        const client = store.clients.find((c) => c.id === a.clientId);
        const service = store.services.find((s) => s.id === a.serviceId);

        return {
          ...a,
          barberName: barber.name,
          barberColor: barber.colorTag,
          barberCommissionPct: barber.commissionPercentage,
          commissionAmount: a.totalPrice, // 100% para barbero independiente
          clientName: client?.name || 'Cliente Ocasional',
          clientPhone: client?.whatsappPhone || '',
          clientNoShows: client?.totalNoShows || 0,
          serviceName: service?.name || 'Corte Personalizado',
          serviceDuration: service?.durationMinutes || 35,
        };
      });

    // Métricas del día
    const activeCount = appointmentsForDate.filter((a) => a.status !== 'cancelled').length;
    const completedCount = appointmentsForDate.filter((a) => a.status === 'completed').length;
    const noShowCount = appointmentsForDate.filter((a) => a.status === 'no_show').length;
    const totalRevenue = appointmentsForDate
      .filter((a) => a.status === 'completed' || a.status === 'confirmed')
      .reduce((sum, a) => sum + a.totalPrice, 0);

    const blocksForDate = store.blocks.filter((b) => b.date === date);

    return {
      date,
      tenant,
      barber,
      barbers: [barber],
      services,
      settings: store.settings,
      appointments: appointmentsForDate,
      blocks: blocksForDate,
      metrics: {
        totalBookings: activeCount,
        completedCount,
        noShowCount,
        totalRevenue,
        myEarnings: totalRevenue,
        occupancyPercentage: Math.min(100, Math.round((activeCount / 8) * 100)),
      },
    };
  }
}

export default DashboardService;
