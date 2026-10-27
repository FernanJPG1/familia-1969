-- ============================================================================
-- B2B BARBERSHOP SAAS - MIGRACIÓN INICIAL DDL
-- Compatible con PostgreSQL y MySQL (ACID Transactions, Foreign Keys, Indexes)
-- ============================================================================

-- 1. TENANTS (Barberías con soporte multi-sucursal / multi-inquilino)
CREATE TABLE IF NOT EXISTS tenants (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(50),
    address VARCHAR(255),
    timezone VARCHAR(50) DEFAULT 'America/Bogota',
    slot_buffer_minutes INT DEFAULT 10,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. BARBERS (Barberos por tenant, color para UI, comisión)
CREATE TABLE IF NOT EXISTS barbers (
    id VARCHAR(36) PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    color_tag VARCHAR(20) NOT NULL DEFAULT '#3B82F6', -- Color HEX para identificación visual en el Timeline
    commission_percentage DECIMAL(5,2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_barbers_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);
CREATE INDEX idx_barbers_tenant ON barbers(tenant_id, is_active);

-- 3. SERVICES (Catálogo de servicios, duración y precio)
CREATE TABLE IF NOT EXISTS services (
    id VARCHAR(36) PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    duration_minutes INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_services_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);
CREATE INDEX idx_services_tenant ON services(tenant_id, is_active);

-- 4. CLIENTS (Clientes capturados vía WhatsApp y métrica de no-shows)
CREATE TABLE IF NOT EXISTS clients (
    id VARCHAR(36) PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    whatsapp_phone VARCHAR(50) NOT NULL,
    total_no_shows INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_clients_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT uq_tenant_whatsapp UNIQUE (tenant_id, whatsapp_phone)
);
CREATE INDEX idx_clients_whatsapp ON clients(tenant_id, whatsapp_phone);

-- 5. BARBER_SCHEDULES (Jornadas laborales semanales recurrentes)
-- day_of_week: 1 = Lunes, 2 = Martes, 3 = Miércoles, 4 = Jueves, 5 = Viernes, 6 = Sábado, 7 = Domingo
CREATE TABLE IF NOT EXISTS barber_schedules (
    id VARCHAR(36) PRIMARY KEY,
    barber_id VARCHAR(36) NOT NULL,
    day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
    start_time VARCHAR(8) NOT NULL, -- Formato 'HH:MM:SS' o 'HH:MM'
    end_time VARCHAR(8) NOT NULL,   -- Formato 'HH:MM:SS' o 'HH:MM'
    is_active BOOLEAN DEFAULT TRUE,
    CONSTRAINT fk_schedules_barber FOREIGN KEY (barber_id) REFERENCES barbers(id) ON DELETE CASCADE
);
CREATE INDEX idx_schedules_barber_day ON barber_schedules(barber_id, day_of_week, is_active);

-- 6. SCHEDULE_BLOCKS (Bloqueos de agenda puntuales: almuerzos, permisos, citas personales)
CREATE TABLE IF NOT EXISTS schedule_blocks (
    id VARCHAR(36) PRIMARY KEY,
    barber_id VARCHAR(36) NOT NULL,
    date VARCHAR(10) NOT NULL,      -- Formato 'YYYY-MM-DD'
    start_time VARCHAR(8) NOT NULL, -- Formato 'HH:MM:SS' o 'HH:MM'
    end_time VARCHAR(8) NOT NULL,   -- Formato 'HH:MM:SS' o 'HH:MM'
    reason VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_blocks_barber FOREIGN KEY (barber_id) REFERENCES barbers(id) ON DELETE CASCADE
);
CREATE INDEX idx_blocks_barber_date ON schedule_blocks(barber_id, date);

-- 7. APPOINTMENTS (Citas y estados del ciclo de vida)
CREATE TABLE IF NOT EXISTS appointments (
    id VARCHAR(36) PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    barber_id VARCHAR(36) NOT NULL,
    client_id VARCHAR(36) NOT NULL,
    service_id VARCHAR(36) NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'confirmed' 
        CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'no_show')),
    notes TEXT,
    reminder_sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_appointments_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_appointments_barber FOREIGN KEY (barber_id) REFERENCES barbers(id) ON DELETE RESTRICT,
    CONSTRAINT fk_appointments_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE RESTRICT,
    CONSTRAINT fk_appointments_service FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE RESTRICT
);
-- Índices para búsqueda de solapamiento de disponibilidad y reportes en tiempo real
CREATE INDEX idx_appointments_collision ON appointments(barber_id, start_time, end_time, status);
CREATE INDEX idx_appointments_timeline ON appointments(tenant_id, start_time, status);
CREATE INDEX idx_appointments_client ON appointments(client_id);

-- 8. WHATSAPP_SESSIONS (Persistencia para la Máquina de Estados del Bot Conversacional)
CREATE TABLE IF NOT EXISTS whatsapp_sessions (
    id VARCHAR(36) PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    whatsapp_phone VARCHAR(50) NOT NULL,
    current_step VARCHAR(50) NOT NULL DEFAULT 'IDLE',
    context_data TEXT NOT NULL, -- JSON con service_id, barber_id, date, slot_start, etc.
    last_interaction_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    CONSTRAINT fk_sessions_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT uq_session_phone UNIQUE (tenant_id, whatsapp_phone)
);
CREATE INDEX idx_sessions_lookup ON whatsapp_sessions(tenant_id, whatsapp_phone, expires_at);
