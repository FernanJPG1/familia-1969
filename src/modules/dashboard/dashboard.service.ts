import { store } from '../../database/store';
import { DateTimeUtils } from '../../core/utils/datetime.utils';

export class DashboardService {
  public static getDashboardForDate(queryDate?: string, filterBarberId?: string) {
    const date = queryDate || DateTimeUtils.getTodayDateString();
    const tenant = store.getPrimaryTenant();
    const primaryBarber = store.getPrimaryBarber();
    const activeBarbers = store.getActiveBarbers();
    const services = store.services.filter((s) => s.isActive);

    // Obtener citas del día
    let appointmentsForDate = store.appointments
      .filter((a) => {
        const aDate = DateTimeUtils.extractDateAndTime(a.startTime).dateStr;
        return aDate === date;
      });

    // Si se especificó un barbero particular (por ejemplo, barbero viendo solo su agenda)
    if (filterBarberId) {
      appointmentsForDate = appointmentsForDate.filter((a) => a.barberId === filterBarberId);
    }

    const mappedAppointments = appointmentsForDate.map((a) => {
      const client = store.clients.find((c) => c.id === a.clientId);
      const service = store.services.find((s) => s.id === a.serviceId);
      const apptBarber = store.barbers.find((b) => b.id === a.barberId) || primaryBarber;

      const commPct = apptBarber?.commissionPercentage ?? 100;
      const commissionAmount = Math.round((a.totalPrice * commPct) / 100);

      return {
        ...a,
        barberName: apptBarber?.name || 'Barbero Oficial',
        barberColor: apptBarber?.colorTag || '#3B82F6',
        barberPhone: apptBarber?.phone || '',
        barberCommissionPct: commPct,
        commissionAmount,
        clientName: client?.name || 'Cliente Ocasional',
        clientPhone: client?.whatsappPhone || '',
        clientNoShows: client?.totalNoShows || 0,
        serviceName: service?.name || 'Corte Personalizado',
        serviceDuration: service?.durationMinutes || 35,
      };
    });

    // Métricas del día
    const activeCount = mappedAppointments.filter((a) => a.status !== 'cancelled').length;
    const completedCount = mappedAppointments.filter((a) => a.status === 'completed').length;
    const noShowCount = mappedAppointments.filter((a) => a.status === 'no_show').length;
    const totalRevenue = mappedAppointments
      .filter((a) => a.status === 'completed' || a.status === 'confirmed')
      .reduce((sum, a) => sum + a.totalPrice, 0);

    const myEarnings = mappedAppointments
      .filter((a) => a.status === 'completed' || a.status === 'confirmed')
      .reduce((sum, a) => sum + (a.commissionAmount || 0), 0);

    const blocksForDate = store.blocks.filter((b) => b.date === date);

    return {
      date,
      tenant,
      barber: primaryBarber,
      barbers: activeBarbers.length > 0 ? activeBarbers : [primaryBarber],
      services,
      settings: store.settings,
      appointments: mappedAppointments,
      blocks: blocksForDate,
      metrics: {
        totalBookings: activeCount,
        completedCount,
        noShowCount,
        totalRevenue,
        myEarnings: filterBarberId ? myEarnings : totalRevenue,
        occupancyPercentage: Math.min(100, Math.round((activeCount / 8) * 100)),
      },
    };
  }
}

export default DashboardService;
