"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.store = exports.DataStore = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const datetime_utils_1 = require("../core/utils/datetime.utils");
const mutex_1 = require("../core/utils/mutex");
const constants_1 = require("../config/constants");
const isVercel = Boolean(process.env.VERCEL);
const DATA_DIR = isVercel ? '/tmp/data' : path_1.default.resolve(process.cwd(), 'data');
const DB_FILE = path_1.default.join(DATA_DIR, 'store.json');
const BUNDLED_DB_FILE = path_1.default.resolve(process.cwd(), 'data', 'store.json');
/**
 * Almacén en memoria seguro para el negocio y agenda de Mateo Silva.
 * Se encarga del estado de la barbería, sincronización de jornadas y descansos.
 */
class DataStore {
    tenants = [];
    barbers = [];
    services = [];
    clients = [];
    schedules = [];
    blocks = [];
    appointments = [];
    sessions = [];
    settings = {
        shopName: "FAMILIA 1969 • Barber Club & Atelier",
        barberName: "Mateo Silva (Director & Master Barber)",
        phone: "+57 311 111 2233",
        address: "Carrera 15 # 85-30, Zona Rosa, Bogotá",
        parkingInfo: "Convenio de parqueadero privado frente al club",
        slotBufferMinutes: constants_1.APP_CONSTANTS.DEFAULT_SLOT_BUFFER_MINUTES,
        workStartTime: constants_1.APP_CONSTANTS.DEFAULT_WORK_START,
        workEndTime: constants_1.APP_CONSTANTS.DEFAULT_WORK_END,
        lunchStartTime: constants_1.APP_CONSTANTS.DEFAULT_LUNCH_START,
        lunchEndTime: constants_1.APP_CONSTANTS.DEFAULT_LUNCH_END,
        lunchEnabled: true,
        activeDays: [1, 2, 3, 4, 5, 6], // Lunes a Sábado
        customGreeting: "¡Hola! Bienvenido al canal de reservas de FAMILIA 1969 (Master Barber: Mateo Silva) 💈. ¿Qué corte o servicio deseas agendar hoy?",
        autoBotEnabled: true,
    };
    constructor() {
        if (isVercel && !fs_1.default.existsSync(DB_FILE) && fs_1.default.existsSync(BUNDLED_DB_FILE)) {
            try {
                if (!fs_1.default.existsSync(DATA_DIR)) {
                    fs_1.default.mkdirSync(DATA_DIR, { recursive: true });
                }
                fs_1.default.copyFileSync(BUNDLED_DB_FILE, DB_FILE);
            }
            catch (e) {
                console.warn('Advertencia copiando data a /tmp:', e);
            }
        }
        if (fs_1.default.existsSync(DB_FILE)) {
            try {
                this.load();
            }
            catch (e) {
                console.error('Error cargando persistencia store.json, iniciando semilla:', e);
                this.seed();
                this.persist();
            }
        }
        else if (fs_1.default.existsSync(BUNDLED_DB_FILE)) {
            try {
                const raw = fs_1.default.readFileSync(BUNDLED_DB_FILE, 'utf-8');
                const parsed = JSON.parse(raw);
                if (parsed.settings)
                    this.settings = { ...this.settings, ...parsed.settings };
                if (Array.isArray(parsed.tenants))
                    this.tenants = parsed.tenants;
                if (Array.isArray(parsed.barbers))
                    this.barbers = parsed.barbers;
                if (Array.isArray(parsed.services))
                    this.services = parsed.services;
                if (Array.isArray(parsed.clients))
                    this.clients = parsed.clients;
                if (Array.isArray(parsed.appointments))
                    this.appointments = parsed.appointments;
                this.rebuildSchedulesAndBlocks();
                this.persist();
            }
            catch {
                this.seed();
                this.persist();
            }
        }
        else {
            this.seed();
            this.persist();
        }
    }
    persist() {
        try {
            if (!fs_1.default.existsSync(DATA_DIR)) {
                fs_1.default.mkdirSync(DATA_DIR, { recursive: true });
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
            fs_1.default.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
            fs_1.default.renameSync(tempFile, DB_FILE);
        }
        catch (err) {
            console.error('Error al persistir base de datos a disco:', err);
        }
    }
    load() {
        const raw = fs_1.default.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed.settings) {
            this.settings = { ...this.settings, ...parsed.settings };
        }
        if (Array.isArray(parsed.tenants)) {
            this.tenants = parsed.tenants.map((t) => ({
                ...t,
                createdAt: new Date(t.createdAt),
                updatedAt: new Date(t.updatedAt),
            }));
        }
        if (Array.isArray(parsed.barbers)) {
            this.barbers = parsed.barbers.map((b) => ({
                ...b,
                createdAt: new Date(b.createdAt),
                updatedAt: new Date(b.updatedAt),
            }));
        }
        if (Array.isArray(parsed.services)) {
            this.services = parsed.services.map((s) => ({
                ...s,
                createdAt: new Date(s.createdAt),
                updatedAt: new Date(s.updatedAt),
            }));
        }
        if (Array.isArray(parsed.clients)) {
            this.clients = parsed.clients.map((c) => ({
                ...c,
                createdAt: new Date(c.createdAt),
                updatedAt: new Date(c.updatedAt),
            }));
        }
        if (Array.isArray(parsed.appointments)) {
            this.appointments = parsed.appointments.map((a) => ({
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
    async acquireLock(task) {
        return mutex_1.globalMutex.acquire(task);
    }
    seed() {
        const tenantId = 'tenant-demo-1';
        // 1. Tenant Principal
        this.tenants = [
            {
                id: tenantId,
                name: this.settings.shopName,
                slug: 'mateo-silva-barber',
                phone: this.settings.phone,
                address: this.settings.address,
                timezone: constants_1.APP_CONSTANTS.TIMEZONE,
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
        const todayStr = datetime_utils_1.DateTimeUtils.getTodayDateString();
        const start1 = datetime_utils_1.DateTimeUtils.buildDateTime(todayStr, '10:00');
        const end1 = datetime_utils_1.DateTimeUtils.buildDateTime(todayStr, '10:40');
        const start2 = datetime_utils_1.DateTimeUtils.buildDateTime(todayStr, '11:00');
        const end2 = datetime_utils_1.DateTimeUtils.buildDateTime(todayStr, '12:00');
        const start3 = datetime_utils_1.DateTimeUtils.buildDateTime(todayStr, '15:00');
        const end3 = datetime_utils_1.DateTimeUtils.buildDateTime(todayStr, '15:30');
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
    rebuildSchedulesAndBlocks() {
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
                const dateStr = datetime_utils_1.DateTimeUtils.extractDateAndTime(d).dateStr;
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
    updateSettings(partial) {
        if (partial.slotBufferMinutes !== undefined) {
            partial.slotBufferMinutes = Number(partial.slotBufferMinutes);
        }
        if (partial.lunchEnabled !== undefined) {
            partial.lunchEnabled = partial.lunchEnabled === true || partial.lunchEnabled === 'true';
        }
        if (partial.autoBotEnabled !== undefined) {
            partial.autoBotEnabled = partial.autoBotEnabled === true || partial.autoBotEnabled === 'true';
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
    getPrimaryTenant() {
        return this.tenants[0];
    }
    getPrimaryBarber() {
        return this.barbers[0];
    }
    findClientByPhone(phone) {
        return this.clients.find((c) => c.whatsappPhone === phone);
    }
    findServiceById(id) {
        return this.services.find((s) => s.id === id);
    }
    findAppointmentById(id) {
        return this.appointments.find((a) => a.id === id);
    }
    getAppointmentsForDate(dateStr) {
        return this.appointments.filter((a) => {
            const aDate = datetime_utils_1.DateTimeUtils.extractDateAndTime(a.startTime).dateStr;
            return aDate === dateStr;
        });
    }
}
exports.DataStore = DataStore;
exports.store = new DataStore();
exports.default = exports.store;
