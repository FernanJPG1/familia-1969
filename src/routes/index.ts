import { Router } from 'express';
import { store } from '../database/store';
import servicesRoutes from '../modules/services/services.routes';
import settingsRoutes from '../modules/settings/settings.routes';
import dashboardRoutes from '../modules/dashboard/dashboard.routes';
import appointmentsRoutes from '../modules/appointments/appointments.routes';
import availabilityRoutes from '../modules/availability/availability.routes';
import whatsappRoutes from '../modules/whatsapp/whatsapp.routes';

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
  });
});

// Registrar módulos
router.use('/services', servicesRoutes);
router.use('/settings', settingsRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/appointments', appointmentsRoutes);
router.use('/availability', availabilityRoutes);
router.use('/whatsapp', whatsappRoutes);

export default router;
