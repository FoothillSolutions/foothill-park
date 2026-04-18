-- Initial schema for Foothill Park

CREATE TABLE IF NOT EXISTS employees (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entra_id        VARCHAR(255) UNIQUE NOT NULL,
    bamboo_id       VARCHAR(100) UNIQUE,
    display_name    VARCHAR(255) NOT NULL,
    phone           VARCHAR(50),
    discord_id      VARCHAR(100),
    department      VARCHAR(255),
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS plates (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id      UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    plate_number     VARCHAR(20) NOT NULL,
    plate_normalized VARCHAR(20) NOT NULL,
    country_code     VARCHAR(5) DEFAULT 'PS',
    is_active        BOOLEAN DEFAULT true,
    registered_by    UUID REFERENCES employees(id),
    created_at       TIMESTAMPTZ DEFAULT NOW(),
    updated_at       TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(plate_normalized, country_code)
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id        UUID NOT NULL REFERENCES employees(id),
    action          VARCHAR(50) NOT NULL,
    target_plate    VARCHAR(20),
    target_employee UUID REFERENCES employees(id),
    metadata        JSONB DEFAULT '{}',
    ip_address      INET,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_plates_normalized ON plates(plate_normalized) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_audit_actor       ON audit_logs(actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_created     ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_employees_entra   ON employees(entra_id);
