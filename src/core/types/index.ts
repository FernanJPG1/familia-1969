// ============================================================================
// DOMAIN MODELS & DTOs - B2B BARBERSHOP SAAS
// ============================================================================

export * from './whatsapp.types';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  phone?: string | null;
  address?: string | null;
  timezone: string;
  slotBufferMinutes: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Barber {
  id: string;
  tenantId: string;
  name: string;
  phone?: string | null;
  colorTag: string;
  commissionPercentage: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Service {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  category?: string; // "Corte", "Barba", "Combo", "Tratamiento", "Especial"
  badge?: string;    // "🔥 Más Popular", "⭐ Recomendado", "👑 VIP", "⚡ Express"
  icon?: string;
  durationMinutes: number;
  price: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Client {
  id: string;
  tenantId: string;
  name: string;
  whatsappPhone: string;
  totalNoShows: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface BarberSchedule {
  id: string;
  barberId: string;
  dayOfWeek: number; // 1 = Lunes ... 7 = Domingo
  startTime: string; // "09:00"
  endTime: string;   // "19:00"
  isActive: boolean;
}

export interface ScheduleBlock {
  id: string;
  barberId: string;
  date: string;      // "YYYY-MM-DD"
  startTime: string; // "13:00"
  endTime: string;   // "14:00"
  reason: string;
  createdAt: Date;
}

export type AppointmentStatus = 'pending' | 'confirmed' | 'arrived' | 'completed' | 'cancelled' | 'no_show';

export interface Appointment {
  id: string;
  tenantId: string;
  barberId: string;
  clientId: string;
  serviceId: string;
  startTime: Date;
  endTime: Date;
  totalPrice: number;
  status: AppointmentStatus;
  notes?: string | null;
  reminderSentAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  
  // Propiedades enriquecidas para presentación
  barberName?: string;
  barberColor?: string;
  barberCommissionPct?: number;
  commissionAmount?: number;
  clientName?: string;
  clientPhone?: string;
  clientNoShows?: number;
  serviceName?: string;
  serviceDuration?: number;
}

export interface TimeSlot {
  startTime: string;     // ISO String
  endTime: string;       // ISO String
  formattedTime: string; // "10:00 AM - 10:40 AM"
  available: boolean;
  barberId: string;
  barberName?: string;
  reason?: string;       // Motivo si no está disponible (ej: "Almuerzo", "Ocupado", "Pasado")
}

export interface AvailabilityQuery {
  tenantId?: string;
  barberId?: string;
  serviceId: string;
  date: string; // YYYY-MM-DD
}

export interface BarberSettings {
  shopName: string;
  barberName: string;
  phone: string;
  address: string;
  parkingInfo: string;
  slotBufferMinutes: number;
  workStartTime: string;
  workEndTime: string;
  lunchStartTime: string;
  lunchEndTime: string;
  lunchEnabled: boolean;
  activeDays: number[]; // 1 = Lun, 2 = Mar, ..., 7 = Dom
  customGreeting: string;
  autoBotEnabled: boolean;
}

export interface DashboardMetrics {
  totalBookings: number;
  completedCount: number;
  noShowCount: number;
  totalRevenue: number;
  myEarnings: number;
  occupancyPercentage: number;
}
