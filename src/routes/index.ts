import { Router } from 'express';
import { store } from '../database/store';
import servicesRoutes from '../modules/services/services.routes';
import settingsRoutes from '../modules/settings/settings.routes';
import dashboardRoutes from '../modules/dashboard/dashboard.routes';
import appointmentsRoutes from '../modules/appointments/appointments.routes';
import availabilityRoutes from '../modules/availability/availability.routes';
import whatsappRoutes from '../modules/whatsapp/whatsapp.routes';
import authRoutes from '../modules/auth/auth.routes';
import adminRoutes from '../modules/admin/admin.routes';

const router = Router();

// Health check & Server Status
router.get('/health', (req: any, res: any) => {
  const barber = store.getPrimaryBarber();
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'Barberia Pro API & WhatsApp Bot',
    barber: barber?.name,
    activeAppointments: store.appointments.length,
    servicesCount: store.services.length,
    activeBarbersCount: store.getActiveBarbers().length,
  });
});

// Endpoint público para obtener la lista de barberos activos disponibles para agendar
router.get('/barbers/active', (req: any, res: any) => {
  const activeBarbers = store.getActiveBarbers().map(b => ({
    id: b.id,
    name: b.name,
    colorTag: b.colorTag,
    phone: b.phone
  }));
  res.json({ barbers: activeBarbers });
});

// Registrar módulos
router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/services', servicesRoutes);
router.use('/settings', settingsRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/appointments', appointmentsRoutes);
router.use('/availability', availabilityRoutes);
router.use('/whatsapp', whatsappRoutes);

export default router;
