// ============================================================================
// DOMAIN MODELS & DTOs - B2B BARBERSHOP SAAS
// ============================================================================

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

export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';

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
  // Relaciones hidratadas opcionales
  barber?: Barber;
  client?: Client;
  service?: Service;
}

export interface WhatsAppSession {
  id: string;
  tenantId: string;
  whatsappPhone: string;
  currentStep: WhatsAppStep;
  contextData: WhatsAppBookingContext;
  lastInteractionAt: Date;
  expiresAt: Date;
}

export type WhatsAppStep = 
  | 'IDLE'
  | 'AWAITING_SERVICE'
  | 'AWAITING_BARBER'
  | 'AWAITING_DATE'
  | 'AWAITING_SLOT'
  | 'AWAITING_NAME'
  | 'CONFIRMED';

export interface WhatsAppBookingContext {
  serviceId?: string;
  serviceName?: string;
  servicePrice?: number;
  serviceDuration?: number;
  barberId?: string;
  barberName?: string;
  date?: string; // YYYY-MM-DD
  slotStartTime?: string; // ISO string
  slotEndTime?: string;   // ISO string
  clientName?: string;
  clientId?: string;
}

export interface TimeSlot {
  startTime: string; // ISO String (UTC/Local)
  endTime: string;   // ISO String (UTC/Local)
  formattedTime: string; // "10:00 AM - 10:40 AM"
  available: boolean;
  barberId: string;
  barberName?: string;
}

export interface AvailabilityQuery {
  tenantId: string;
  barberId?: string; // Si es null/undefined, busca para cualquier barbero disponible
  serviceId: string;
  date: string; // YYYY-MM-DD
}
