import fs from 'fs';
import path from 'path';
import { 
  Tenant, 
  Barber, 
  Service, 
  Client, 
  BarberSchedule, 
  ScheduleBlock, 
  Appointment, 
  WhatsAppSession,
  BarberSettings
} from '../core/types';
import { DateTimeUtils } from '../core/utils/datetime.utils';
import { globalMutex } from '../core/utils/mutex';
import { APP_CONSTANTS } from '../config/constants';

const isVercel = Boolean(process.env.VERCEL);
const DATA_DIR = isVercel ? '/tmp/data' : path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'store.json');
const BUNDLED_DB_FILE = path.resolve(process.cwd(), 'data', 'store.json');

/**
 * Almacén en memoria seguro para el negocio y agenda de Mateo Silva.
 * Se encarga del estado de la barbería, sincronización de jornadas y descansos.
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
    shopName: "FAMILIA 1969 • Barber Club & Atelier",
    barberName: "Mateo Silva (Director & Master Barber)",
    phone: "+57 311 111 2233",
    address: "Carrera 15 # 85-30, Zona Rosa, Bogotá",
    parkingInfo: "Convenio de parqueadero privado frente al club",
    slotBufferMinutes: APP_CONSTANTS.DEFAULT_SLOT_BUFFER_MINUTES,
    workStartTime: APP_CONSTANTS.DEFAULT_WORK_START,
    workEndTime: APP_CONSTANTS.DEFAULT_WORK_END,
    lunchStartTime: APP_CONSTANTS.DEFAULT_LUNCH_START,
    lunchEndTime: APP_CONSTANTS.DEFAULT_LUNCH_END,
    lunchEnabled: true,
    activeDays: [1, 2, 3, 4, 5, 6], // Lunes a Sábado
    customGreeting: "¡Hola! Bienvenido al canal de reservas de FAMILIA 1969 (Master Barber: Mateo Silva) 💈. ¿Qué corte o servicio deseas agendar hoy?",
    autoBotEnabled: true,
  };

  constructor() {
    if (isVercel && !fs.existsSync(DB_FILE) && fs.existsSync(BUNDLED_DB_FILE)) {
      try {
        if (!fs.existsSync(DATA_DIR)) {
          fs.mkdirSync(DATA_DIR, { recursive: true });
        }
        fs.copyFileSync(BUNDLED_DB_FILE, DB_FILE);
      } catch (e) {
        console.warn('Advertencia copiando data a /tmp:', e);
      }
    }

    if (fs.existsSync(DB_FILE)) {
      try {
        this.load();
      } catch (e) {
        console.error('Error cargando persistencia store.json, iniciando semilla:', e);
        this.seed();
        this.persist();
      }
    } else if (fs.existsSync(BUNDLED_DB_FILE)) {
      try {
        const raw = fs.readFileSync(BUNDLED_DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed.settings) this.settings = { ...this.settings, ...parsed.settings };
        if (Array.isArray(parsed.tenants)) this.tenants = parsed.tenants;
        if (Array.isArray(parsed.barbers)) this.barbers = parsed.barbers;
        if (Array.isArray(parsed.services)) this.services = parsed.services;
        if (Array.isArray(parsed.clients)) this.clients = parsed.clients;
        if (Array.isArray(parsed.appointments)) this.appointments = parsed.appointments;
        this.rebuildSchedulesAndBlocks();
        this.persist();
      } catch {
        this.seed();
        this.persist();
      }
    } else {
      this.seed();
      this.persist();
    }
  }

  public persist(): void {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const data = {
        version: 1,
        savedAt: new Date().toISOString(),
        settings: this.settings,
        tenants: this.tenants,
        barbers: this.barbers,
        services: this.services,
        clients: this.clients,
        appointments: this.appointments,
      };
      const tempFile = `${DB_FILE}.tmp`;
      fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
      fs.renameSync(tempFile, DB_FILE);
    } catch (err) {
      console.error('Error al persistir base de datos a disco:', err);
    }
  }

  public load(): void {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw);

    if (parsed.settings) {
      this.settings = { ...this.settings, ...parsed.settings };
    }
    if (Array.isArray(parsed.tenants)) {
      this.tenants = parsed.tenants.map((t: any) => ({
        ...t,
        createdAt: new Date(t.createdAt),
        updatedAt: new Date(t.updatedAt),
      }));
    }
    if (Array.isArray(parsed.barbers)) {
      this.barbers = parsed.barbers.map((b: any) => ({
        ...b,
        createdAt: new Date(b.createdAt),
        updatedAt: new Date(b.updatedAt),
      }));
    }
    if (Array.isArray(parsed.services)) {
      this.services = parsed.services.map((s: any) => ({
        ...s,
        createdAt: new Date(s.createdAt),
        updatedAt: new Date(s.updatedAt),
      }));
    }
    if (Array.isArray(parsed.clients)) {
      this.clients = parsed.clients.map((c: any) => ({
        ...c,
        createdAt: new Date(c.createdAt),
        updatedAt: new Date(c.updatedAt),
      }));
    }
    if (Array.isArray(parsed.appointments)) {
      this.appointments = parsed.appointments.map((a: any) => ({
        ...a,
        startTime: new Date(a.startTime),
        endTime: new Date(a.endTime),
        reminderSentAt: a.reminderSentAt ? new Date(a.reminderSentAt) : null,
        createdAt: new Date(a.createdAt),
        updatedAt: new Date(a.updatedAt),
      }));
    }

    this.rebuildSchedulesAndBlocks();
  }

  public async acquireLock<T>(task: () => Promise<T>): Promise<T> {
    return globalMutex.acquire(task);
  }

  public seed(): void {
    const tenantId = 'tenant-demo-1';
    
    // 1. Tenant Principal
    this.tenants = [
      {
        id: tenantId,
        name: this.settings.shopName,
        slug: 'mateo-silva-barber',
        phone: this.settings.phone,
        address: this.settings.address,
        timezone: APP_CONSTANTS.TIMEZONE,
        slotBufferMinutes: this.settings.slotBufferMinutes,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    // 2. Barbero Principal
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

    // 3. Generar jornadas y descansos
    this.rebuildSchedulesAndBlocks();

    // 4. Catálogo de Servicios
    this.services = [
      {
        id: 'srv-1',
        tenantId,
        name: 'Corte Clásico & Fade Texturizado',
        category: 'Corte',
        description: 'Degradado milimétrico (Low, Mid o High Fade), corte a tijera superior, lavado y peinado con pomada mate.',
        badge: '🔥 Más Popular',
        icon: 'fa-scissors',
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
        category: 'Barba',
        description: 'Perfilado a navaja, toalla caliente al vapor, masaje con aceites esenciales hidratantes y bálsamo nutritivo.',
        badge: '⭐ Relajante',
        icon: 'fa-user-tie',
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
        category: 'Combo',
        description: 'Experiencia total: Corte o Fade completo, ritual de barba con toalla caliente y mascarilla negra purificante.',
        badge: '👑 VIP',
        icon: 'fa-crown',
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
        category: 'Tratamiento',
        description: 'Definición simétrica de cejas a navaja y exfoliación facial suave para retirar impurezas de la piel.',
        badge: '⚡ Rápido',
        icon: 'fa-wand-magic-sparkles',
        durationMinutes: 20,
        price: 18000,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    // 5. Clientes habituales
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

    // 6. Citas de prueba para hoy generadas con DateTimeUtils exacto
    const todayStr = DateTimeUtils.getTodayDateString();

    const start1 = DateTimeUtils.buildDateTime(todayStr, '10:00');
    const end1 = DateTimeUtils.buildDateTime(todayStr, '10:40');

    const start2 = DateTimeUtils.buildDateTime(todayStr, '11:00');
    const end2 = DateTimeUtils.buildDateTime(todayStr, '12:00');

    const start3 = DateTimeUtils.buildDateTime(todayStr, '15:00');
    const end3 = DateTimeUtils.buildDateTime(todayStr, '15:30');

    this.appointments = [
      {
        id: 'app-demo-1',
        tenantId,
        barberId: 'barber-1',
        clientId: 'client-1',
        serviceId: 'srv-1',
        startTime: start1,
        endTime: end1,
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
        startTime: start2,
        endTime: end2,
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
        startTime: start3,
        endTime: end3,
        totalPrice: 25000,
        status: 'pending',
        notes: 'Pendiente de confirmación interactiva T-2h.',
        reminderSentAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
  }

  /**
   * Reconstruye horarios y bloqueos de almuerzo para los próximos 14 días
   */
  public rebuildSchedulesAndBlocks(): void {
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
      const now = new Date();
      for (let i = -1; i < 14; i++) {
        const d = new Date(now);
        d.setDate(now.getDate() + i);
        const dateStr = DateTimeUtils.extractDateAndTime(d).dateStr;

        this.blocks.push({
          id: `block-lunch-${dateStr}`,
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
   * Actualiza la configuración global del negocio con validación de tipos
   */
  public updateSettings(partial: Partial<BarberSettings>): BarberSettings {
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
    this.persist();
    return this.settings;
  }

  // ==========================================================================
  // HELPERS DE CONSULTA RÁPIDA
  // ==========================================================================

  public getPrimaryTenant(): Tenant {
    return this.tenants[0];
  }

  public getPrimaryBarber(): Barber {
    return this.barbers[0];
  }

  public findClientByPhone(phone: string): Client | undefined {
    return this.clients.find((c) => c.whatsappPhone === phone);
  }

  public findServiceById(id: string): Service | undefined {
    return this.services.find((s) => s.id === id);
  }

  public findAppointmentById(id: string): Appointment | undefined {
    return this.appointments.find((a) => a.id === id);
  }

  public getAppointmentsForDate(dateStr: string): Appointment[] {
    return this.appointments.filter((a) => {
      const aDate = DateTimeUtils.extractDateAndTime(a.startTime).dateStr;
      return aDate === dateStr;
    });
  }
}

export const store = new DataStore();
export default store;
