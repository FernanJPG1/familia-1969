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

/**
 * Almacén en memoria persistente e interactivo con soporte de transacciones y datos seed
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

  // Mutex para exclusión mutua en reservas atómicas (prevención de race conditions)
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
    
    // 1. Tenant
    this.tenants = [
      {
        id: tenantId,
        name: "The Gentleman's Cut Barbershop",
        slug: 'gentlemans-cut',
        phone: '+57 300 987 6543',
        address: 'Calle 85 # 14-25, Bogotá',
        timezone: 'America/Bogota',
        slotBufferMinutes: 10,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    // 2. Barberos
    this.barbers = [
      {
        id: 'barber-1',
        tenantId,
        name: 'Mateo Silva (Master Barber)',
        phone: '+57 311 111 2233',
        colorTag: '#3B82F6', // Azul eléctrico
        commissionPercentage: 50.0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'barber-2',
        tenantId,
        name: 'Carlos Mendoza (Fade Specialist)',
        phone: '+57 322 333 4455',
        colorTag: '#10B981', // Verde Esmeralda
        commissionPercentage: 45.0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'barber-3',
        tenantId,
        name: 'Andrés Vega (Beard & Rituals)',
        phone: '+57 315 777 8899',
        colorTag: '#F59E0B', // Ámbar Oro
        commissionPercentage: 50.0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    // 3. Horarios semanales recurrentes (Lunes a Sábado de 09:00 a 19:00)
    this.schedules = [];
    for (const barber of this.barbers) {
      for (let day = 1; day <= 6; day++) {
        this.schedules.push({
          id: `sch-${barber.id}-${day}`,
          barberId: barber.id,
          dayOfWeek: day,
          startTime: '09:00',
          endTime: '19:00',
          isActive: true,
        });
      }
    }

    // 4. Bloqueos de almuerzo (13:00 - 14:00) para hoy y los próximos 7 días
    this.blocks = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];

      for (const barber of this.barbers) {
        this.blocks.push({
          id: `block-${barber.id}-${dateStr}`,
          barberId: barber.id,
          date: dateStr,
          startTime: '13:00',
          endTime: '14:00',
          reason: 'Receso de Almuerzo',
          createdAt: new Date(),
        });
      }
    }

    // 5. Catálogo de Servicios
    this.services = [
      {
        id: 'srv-1',
        tenantId,
        name: 'Corte Clásico & Fade Premium',
        durationMinutes: 40,
        price: 35000,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'srv-2',
        tenantId,
        name: 'Ritual de Barba & Toalla Caliente',
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

    // 7. Citas para hoy (Timeline)
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
        notes: 'Cliente regular. Prefiere fade medio con tijera texturizada.',
        reminderSentAt: new Date(Date.now() - 3600000),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'app-demo-2',
        tenantId,
        barberId: 'barber-2',
        clientId: 'client-2',
        serviceId: 'srv-3',
        startTime: new Date(`${yyyy}-${mm}-${dd}T11:00:00`),
        endTime: new Date(`${yyyy}-${mm}-${dd}T12:00:00`),
        totalPrice: 55000,
        status: 'confirmed',
        notes: 'Combo VIP completo. Confirmó asistencia.',
        reminderSentAt: new Date(Date.now() - 1800000),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'app-demo-3',
        tenantId,
        barberId: 'barber-3',
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
}

export const store = new DataStore();
export default store;
