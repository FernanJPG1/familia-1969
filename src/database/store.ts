import { 
  Tenant, 
  Barber, 
  Service, 
  Client, 
  BarberSchedule, 
  ScheduleBlock, 
  Appointment, 
  WhatsAppSession 
} from '../core/types';

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

/**
 * Almacén en memoria persistente para aplicación de 1 Solo Barbero con Configuración Completa
 */
export class DataStore {
  public tenants: Tenant[] = [];
  public barbers: Barber[] = [];
  public services: Service[] = [];
  public clients: Client[] = [];
  public schedules: BarberSchedule[] = [];
  public blocks: ScheduleBlock[] = [];
  public appointments: Appointment[] = [];
  public sessions: WhatsAppSession[] = [];

  public settings: BarberSettings = {
    shopName: "Mateo Silva Studio • Barbershop",
    barberName: "Mateo Silva (Master Barber)",
    phone: "+57 311 111 2233",
    address: "Carrera 15 # 85-30, Zona Rosa, Bogotá",
    parkingInfo: "Convenio de parqueadero privado frente al estudio",
    slotBufferMinutes: 10,
    workStartTime: "09:00",
    workEndTime: "19:00",
    lunchStartTime: "13:00",
    lunchEndTime: "14:00",
    lunchEnabled: true,
    activeDays: [1, 2, 3, 4, 5, 6], // Lunes a Sábado
    customGreeting: "¡Hola! Bienvenido al canal de reservas de Mateo Silva. ¿Qué tipo de corte o servicio deseas agendar hoy?",
    autoBotEnabled: true,
  };

  private bookingLock: Promise<void> = Promise.resolve();

  constructor() {
    this.seed();
  }

  public async acquireLock<T>(fn: () => Promise<T>): Promise<T> {
    const prevLock = this.bookingLock;
    let release: () => void;
    this.bookingLock = new Promise<void>((resolve) => {
      release = resolve;
    });

    await prevLock;
    try {
      return await fn();
    } finally {
      release!();
    }
  }

  public seed() {
    const tenantId = 'tenant-demo-1';
    
    // 1. Tenant Personal
    this.tenants = [
      {
        id: tenantId,
        name: this.settings.shopName,
        slug: 'mateo-silva-barber',
        phone: this.settings.phone,
        address: this.settings.address,
        timezone: 'America/Bogota',
        slotBufferMinutes: this.settings.slotBufferMinutes,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    // 2. ÚNICO BARBERO (Propietario / Operador)
    this.barbers = [
      {
        id: 'barber-1',
        tenantId,
        name: this.settings.barberName,
        phone: this.settings.phone,
        colorTag: '#F59E0B',
        commissionPercentage: 100.0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    this.rebuildSchedulesAndBlocks();

    // 5. Catálogo Inicial de Cortes y Servicios
    this.services = [
      {
        id: 'srv-1',
        tenantId,
        name: 'Corte Clásico & Fade Texturizado',
        durationMinutes: 40,
        price: 35000,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'srv-2',
        tenantId,
        name: 'Ritual de Barba con Toalla Caliente',
        durationMinutes: 30,
        price: 25000,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'srv-3',
        tenantId,
        name: 'Combo VIP: Corte + Barba + Mascarilla',
        durationMinutes: 60,
        price: 55000,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'srv-4',
        tenantId,
        name: 'Perfilado de Cejas & Exfoliación',
        durationMinutes: 20,
        price: 18000,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    // 6. Clientes
    this.clients = [
      {
        id: 'client-1',
        tenantId,
        name: 'David Rincón',
        whatsappPhone: '573001234567',
        totalNoShows: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'client-2',
        tenantId,
        name: 'Alejandro Morales',
        whatsappPhone: '573109876543',
        totalNoShows: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'client-3',
        tenantId,
        name: 'Camilo Torres',
        whatsappPhone: '573155554433',
        totalNoShows: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    // 7. Citas de prueba para hoy
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');

    this.appointments = [
      {
        id: 'app-demo-1',
        tenantId,
        barberId: 'barber-1',
        clientId: 'client-1',
        serviceId: 'srv-1',
        startTime: new Date(`${yyyy}-${mm}-${dd}T10:00:00`),
        endTime: new Date(`${yyyy}-${mm}-${dd}T10:40:00`),
        totalPrice: 35000,
        status: 'confirmed',
        notes: 'Cliente regular. Prefiere tijera arriba y fade medio.',
        reminderSentAt: new Date(Date.now() - 3600000),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'app-demo-2',
        tenantId,
        barberId: 'barber-1',
        clientId: 'client-2',
        serviceId: 'srv-3',
        startTime: new Date(`${yyyy}-${mm}-${dd}T11:00:00`),
        endTime: new Date(`${yyyy}-${mm}-${dd}T12:00:00`),
        totalPrice: 55000,
        status: 'confirmed',
        notes: 'Combo VIP completo. Confirmó por WhatsApp.',
        reminderSentAt: new Date(Date.now() - 1800000),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'app-demo-3',
        tenantId,
        barberId: 'barber-1',
        clientId: 'client-3',
        serviceId: 'srv-2',
        startTime: new Date(`${yyyy}-${mm}-${dd}T15:00:00`),
        endTime: new Date(`${yyyy}-${mm}-${dd}T15:30:00`),
        totalPrice: 25000,
        status: 'pending',
        notes: 'Pendiente de recordatorio T-2h.',
        reminderSentAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
  }

  /**
   * Reconstruye jornadas de atención y bloqueos de almuerzo según configuración actual
   */
  public rebuildSchedulesAndBlocks() {
    this.schedules = [];
    for (const day of this.settings.activeDays) {
      this.schedules.push({
        id: `sch-barber-1-${day}`,
        barberId: 'barber-1',
        dayOfWeek: day,
        startTime: this.settings.workStartTime,
        endTime: this.settings.workEndTime,
        isActive: true,
      });
    }

    this.blocks = [];
    if (this.settings.lunchEnabled) {
      const today = new Date();
      for (let i = 0; i < 7; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        const dateStr = d.toISOString().split('T')[0];

        this.blocks.push({
          id: `block-barber-1-${dateStr}`,
          barberId: 'barber-1',
          date: dateStr,
          startTime: this.settings.lunchStartTime,
          endTime: this.settings.lunchEndTime,
          reason: 'Receso de Almuerzo',
          createdAt: new Date(),
        });
      }
    }
  }

  /**
   * Actualiza la configuración global del barbero y sus impactos en tiempo real
   */
  public updateSettings(partial: Partial<BarberSettings>) {
    if (partial.slotBufferMinutes !== undefined) {
      partial.slotBufferMinutes = Number(partial.slotBufferMinutes);
    }
    if (partial.lunchEnabled !== undefined) {
      partial.lunchEnabled = partial.lunchEnabled === true || (partial.lunchEnabled as any) === 'true';
    }
    if (partial.autoBotEnabled !== undefined) {
      partial.autoBotEnabled = partial.autoBotEnabled === true || (partial.autoBotEnabled as any) === 'true';
    }
    if (partial.activeDays && Array.isArray(partial.activeDays)) {
      partial.activeDays = partial.activeDays.map(Number);
    }

    this.settings = { ...this.settings, ...partial };

    if (this.tenants[0]) {
      this.tenants[0].name = this.settings.shopName;
      this.tenants[0].phone = this.settings.phone;
      this.tenants[0].address = this.settings.address;
      this.tenants[0].slotBufferMinutes = Number(this.settings.slotBufferMinutes);
      this.tenants[0].updatedAt = new Date();
    }

    if (this.barbers[0]) {
      this.barbers[0].name = this.settings.barberName;
      this.barbers[0].phone = this.settings.phone;
      this.barbers[0].updatedAt = new Date();
    }

    this.rebuildSchedulesAndBlocks();
    return this.settings;
  }
}

export const store = new DataStore();
export default store;
