-- Gateway Database Initialization Script
-- Creates tables for RealmMesh Gateway

-- Create database if not exists (this runs in the gateway_db context)
-- Tables for realm hierarchy and routing

-- Realms table with hierarchical structure
CREATE TABLE IF NOT EXISTS realms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    realm_id VARCHAR(255) UNIQUE NOT NULL,
    parent_id UUID REFERENCES realms(id) ON DELETE CASCADE,
    display_name VARCHAR(255),
    realm_type VARCHAR(50) DEFAULT 'service',
    metadata JSONB DEFAULT '{}',
    policies JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Services registry
CREATE TABLE IF NOT EXISTS services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    realm_id UUID REFERENCES realms(id) ON DELETE CASCADE,
    service_name VARCHAR(255) NOT NULL,
    capabilities JSONB DEFAULT '[]',
    connection_id VARCHAR(255),
    connection_type VARCHAR(50) DEFAULT 'internal',
    status VARCHAR(50) DEFAULT 'offline',
    last_heartbeat TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(realm_id, service_name)
);

-- Route table for fast lookups
CREATE TABLE IF NOT EXISTS routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    route_pattern VARCHAR(500) NOT NULL,
    target_realm_id UUID REFERENCES realms(id) ON DELETE CASCADE,
    target_service_id UUID REFERENCES services(id) ON DELETE CASCADE,
    priority INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Connection sessions
CREATE TABLE IF NOT EXISTS connections (
    id VARCHAR(255) PRIMARY KEY,
    realm_id UUID REFERENCES realms(id) ON DELETE CASCADE,
    connection_type VARCHAR(50) DEFAULT 'websocket',
    gateway_type VARCHAR(50) DEFAULT 'internal',
    connected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'
);

-- Audit log for inter-realm communication
CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_realm_id UUID REFERENCES realms(id) ON DELETE SET NULL,
    target_realm_id UUID REFERENCES realms(id) ON DELETE SET NULL,
    message_type VARCHAR(100),
    operation VARCHAR(100),
    payload_size INTEGER,
    status VARCHAR(50),
    error_message TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'
);

-- Metrics table
CREATE TABLE IF NOT EXISTS metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_type VARCHAR(100) NOT NULL,
    realm_id UUID REFERENCES realms(id) ON DELETE CASCADE,
    value NUMERIC,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_realms_parent ON realms(parent_id);
CREATE INDEX IF NOT EXISTS idx_realms_realm_id ON realms(realm_id);
CREATE INDEX IF NOT EXISTS idx_services_realm ON services(realm_id);
CREATE INDEX IF NOT EXISTS idx_services_status ON services(status);
CREATE INDEX IF NOT EXISTS idx_routes_pattern ON routes(route_pattern);
CREATE INDEX IF NOT EXISTS idx_routes_active ON routes(active);
CREATE INDEX IF NOT EXISTS idx_connections_realm ON connections(realm_id);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_log(timestamp);
CREATE INDEX IF NOT EXISTS idx_metrics_timestamp ON metrics(timestamp);
CREATE INDEX IF NOT EXISTS idx_metrics_type_realm ON metrics(metric_type, realm_id);

-- No default realms - they will be created dynamically
-- Removed automatic seeding of root realm

-- Helper function to get realm path
CREATE OR REPLACE FUNCTION get_realm_path(realm_uuid UUID)
RETURNS TEXT AS $$
DECLARE
    path TEXT;
    current_id UUID;
    current_realm_id VARCHAR(255);
BEGIN
    path := '';
    current_id := realm_uuid;

    WHILE current_id IS NOT NULL LOOP
        SELECT realm_id, parent_id INTO current_realm_id, current_id
        FROM realms WHERE id = current_id;

        IF current_realm_id IS NOT NULL THEN
            IF path = '' THEN
                path := current_realm_id;
            ELSE
                path := current_realm_id || '.' || path;
            END IF;
        END IF;
    END LOOP;

    RETURN path;
END;
$$ LANGUAGE plpgsql;

-- Helper function to inherit policies
CREATE OR REPLACE FUNCTION get_effective_policies(realm_uuid UUID)
RETURNS JSONB AS $$
DECLARE
    policies JSONB;
    current_id UUID;
    parent_policies JSONB;
BEGIN
    policies := '{}';
    current_id := realm_uuid;

    WHILE current_id IS NOT NULL LOOP
        SELECT r.policies, r.parent_id INTO parent_policies, current_id
        FROM realms r WHERE r.id = current_id;

        IF parent_policies IS NOT NULL THEN
            policies := parent_policies || policies;
        END IF;
    END LOOP;

    RETURN policies;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_realms_updated_at BEFORE UPDATE ON realms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_routes_updated_at BEFORE UPDATE ON routes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();