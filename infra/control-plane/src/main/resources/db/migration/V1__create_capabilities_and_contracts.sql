-- ============================================
-- Flyway Migration: V1__create_capabilities_and_contracts.sql
-- ============================================
-- Creates tables for Capabilities and Contracts
-- Stores full JSON/JSONB for flexibility

-- ============================================
-- Capabilities Table
-- ============================================
CREATE TABLE capabilities (
    id BIGSERIAL PRIMARY KEY,
    
    -- Identity
    capability_id VARCHAR(255) NOT NULL,  -- e.g., "healthcare.pharmacy"
    version VARCHAR(50) NOT NULL,         -- e.g., "2.1.0"
    
    -- Metadata
    description TEXT,
    author VARCHAR(255),
    tags TEXT[],                          -- Array of tags
    stability VARCHAR(50) DEFAULT 'stable' CHECK (stability IN ('experimental', 'beta', 'stable', 'deprecated')),
    documentation_url TEXT,
    
    -- Full capability spec (JSONB for querying)
    spec JSONB NOT NULL,
    
    -- Computed fields for quick queries
    services_count INTEGER DEFAULT 0,
    events_count INTEGER DEFAULT 0,
    loops_count INTEGER DEFAULT 0,
    loop_stacks_count INTEGER DEFAULT 0,
    domain_objects_count INTEGER DEFAULT 0,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by VARCHAR(255),
    
    -- Constraints
    UNIQUE(capability_id, version)
);

-- Indexes for capabilities
CREATE INDEX idx_capabilities_capability_id ON capabilities(capability_id);
CREATE INDEX idx_capabilities_version ON capabilities(version);
CREATE INDEX idx_capabilities_stability ON capabilities(stability);
CREATE INDEX idx_capabilities_tags ON capabilities USING GIN(tags);
CREATE INDEX idx_capabilities_spec ON capabilities USING GIN(spec);
CREATE INDEX idx_capabilities_created_at ON capabilities(created_at DESC);

-- Add column for full-text search (populated by trigger)
ALTER TABLE capabilities ADD COLUMN search_vector tsvector;

-- Function to update search vector
CREATE OR REPLACE FUNCTION update_capability_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := to_tsvector('english',
        COALESCE(NEW.capability_id, '') || ' ' ||
        COALESCE(NEW.description, '') || ' ' ||
        COALESCE(array_to_string(NEW.tags, ' '), '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update search vector
CREATE TRIGGER update_capabilities_search_vector
    BEFORE INSERT OR UPDATE OF capability_id, description, tags ON capabilities
    FOR EACH ROW
    EXECUTE FUNCTION update_capability_search_vector();

-- GIN index for fast full-text search
CREATE INDEX idx_capabilities_search_vector ON capabilities USING GIN(search_vector);

-- ============================================
-- Capability Domain Objects (extracted for queries)
-- ============================================
CREATE TABLE capability_domain_objects (
    id BIGSERIAL PRIMARY KEY,
    capability_id BIGINT NOT NULL REFERENCES capabilities(id) ON DELETE CASCADE,
    
    name VARCHAR(255) NOT NULL,
    description TEXT,
    schema JSONB NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(capability_id, name)
);

CREATE INDEX idx_capability_domain_objects_capability_id ON capability_domain_objects(capability_id);
CREATE INDEX idx_capability_domain_objects_name ON capability_domain_objects(name);

-- ============================================
-- Capability Services (extracted for queries)
-- ============================================
CREATE TABLE capability_services (
    id BIGSERIAL PRIMARY KEY,
    capability_id BIGINT NOT NULL REFERENCES capabilities(id) ON DELETE CASCADE,
    
    name VARCHAR(255) NOT NULL,
    description TEXT,
    timeout INTEGER DEFAULT 30000,
    retries INTEGER DEFAULT 0,
    idempotent BOOLEAN DEFAULT false,
    
    -- Full reference path: capability_id/version/ServiceName
    full_ref VARCHAR(500) NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(capability_id, name)
);

CREATE INDEX idx_capability_services_capability_id ON capability_services(capability_id);
CREATE INDEX idx_capability_services_name ON capability_services(name);
CREATE INDEX idx_capability_services_full_ref ON capability_services(full_ref);

-- ============================================
-- Capability Events (extracted for queries)
-- ============================================
CREATE TABLE capability_events (
    id BIGSERIAL PRIMARY KEY,
    capability_id BIGINT NOT NULL REFERENCES capabilities(id) ON DELETE CASCADE,
    
    name VARCHAR(255) NOT NULL,
    topic VARCHAR(255) NOT NULL,
    description TEXT,
    ordering BOOLEAN DEFAULT false,
    
    full_ref VARCHAR(500) NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(capability_id, name)
);

CREATE INDEX idx_capability_events_capability_id ON capability_events(capability_id);
CREATE INDEX idx_capability_events_name ON capability_events(name);
CREATE INDEX idx_capability_events_topic ON capability_events(topic);
CREATE INDEX idx_capability_events_full_ref ON capability_events(full_ref);

-- ============================================
-- Capability Loops (extracted for queries)
-- ============================================
CREATE TABLE capability_loops (
    id BIGSERIAL PRIMARY KEY,
    capability_id BIGINT NOT NULL REFERENCES capabilities(id) ON DELETE CASCADE,
    
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('aggregation', 'voting', 'bidding')),
    description TEXT,
    
    full_ref VARCHAR(500) NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(capability_id, name)
);

CREATE INDEX idx_capability_loops_capability_id ON capability_loops(capability_id);
CREATE INDEX idx_capability_loops_name ON capability_loops(name);
CREATE INDEX idx_capability_loops_type ON capability_loops(type);
CREATE INDEX idx_capability_loops_full_ref ON capability_loops(full_ref);

-- ============================================
-- Capability Loop Stacks (extracted for queries)
-- ============================================
CREATE TABLE capability_loop_stacks (
    id BIGSERIAL PRIMARY KEY,
    capability_id BIGINT NOT NULL REFERENCES capabilities(id) ON DELETE CASCADE,
    
    name VARCHAR(255) NOT NULL,
    description TEXT,
    loops_count INTEGER DEFAULT 0,
    
    full_ref VARCHAR(500) NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(capability_id, name)
);

CREATE INDEX idx_capability_loop_stacks_capability_id ON capability_loop_stacks(capability_id);
CREATE INDEX idx_capability_loop_stacks_name ON capability_loop_stacks(name);
CREATE INDEX idx_capability_loop_stacks_full_ref ON capability_loop_stacks(full_ref);

-- ============================================
-- Contracts Table
-- ============================================
CREATE TABLE contracts (
    id BIGSERIAL PRIMARY KEY,
    
    -- Identity
    realm_id VARCHAR(255) NOT NULL,
    version VARCHAR(50) NOT NULL,
    
    -- Metadata
    description TEXT,
    
    -- Full contract spec (JSONB)
    spec JSONB NOT NULL,
    
    -- Computed fields
    provides_services_count INTEGER DEFAULT 0,
    provides_events_count INTEGER DEFAULT 0,
    provides_loops_count INTEGER DEFAULT 0,
    provides_loop_stacks_count INTEGER DEFAULT 0,
    requires_services_count INTEGER DEFAULT 0,
    requires_events_count INTEGER DEFAULT 0,
    
    -- Validation status
    is_valid BOOLEAN DEFAULT false,
    validation_errors JSONB,
    validated_at TIMESTAMP WITH TIME ZONE,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by VARCHAR(255),
    
    -- Constraints
    UNIQUE(realm_id, version)
);

-- Indexes for contracts
CREATE INDEX idx_contracts_realm_id ON contracts(realm_id);
CREATE INDEX idx_contracts_version ON contracts(version);
CREATE INDEX idx_contracts_is_valid ON contracts(is_valid);
CREATE INDEX idx_contracts_spec ON contracts USING GIN(spec);
CREATE INDEX idx_contracts_created_at ON contracts(created_at DESC);

-- ============================================
-- Contract Bindings (extracted for queries and routing)
-- ============================================
CREATE TABLE contract_bindings (
    id BIGSERIAL PRIMARY KEY,
    contract_id BIGINT NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    
    -- Binding type
    binding_type VARCHAR(50) NOT NULL CHECK (binding_type IN ('service', 'event', 'loop', 'loop_stack')),
    direction VARCHAR(50) NOT NULL CHECK (direction IN ('provides', 'requires')),
    
    -- Capability reference
    capability_ref VARCHAR(500) NOT NULL,  -- e.g., "healthcare.pharmacy/v2.1.0/DrugQuery"
    
    -- Parsed reference parts (for queries)
    capability_id VARCHAR(255) NOT NULL,
    capability_version VARCHAR(50) NOT NULL,
    resource_name VARCHAR(255) NOT NULL,
    
    -- Configuration (JSONB)
    configuration JSONB,
    
    -- For 'provides' bindings
    endpoint VARCHAR(500),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(contract_id, binding_type, direction, capability_ref)
);

CREATE INDEX idx_contract_bindings_contract_id ON contract_bindings(contract_id);
CREATE INDEX idx_contract_bindings_binding_type ON contract_bindings(binding_type);
CREATE INDEX idx_contract_bindings_direction ON contract_bindings(direction);
CREATE INDEX idx_contract_bindings_capability_ref ON contract_bindings(capability_ref);
CREATE INDEX idx_contract_bindings_capability_id ON contract_bindings(capability_id);
CREATE INDEX idx_contract_bindings_resource_name ON contract_bindings(resource_name);

-- ============================================
-- Routing Cache Table
-- ============================================
-- Cached routing decisions for performance
CREATE TABLE routing_cache (
    id BIGSERIAL PRIMARY KEY,
    
    -- Source and target
    source_realm_id VARCHAR(255) NOT NULL,
    target_capability_ref VARCHAR(500) NOT NULL,
    
    -- Routing decision
    available_realms TEXT[],  -- Array of realm IDs that can fulfill this
    gateway_path TEXT[],      -- Array of gateway realms in the path
    
    -- Cache metadata
    cached_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    cache_hits INTEGER DEFAULT 0,
    
    UNIQUE(source_realm_id, target_capability_ref)
);

CREATE INDEX idx_routing_cache_source ON routing_cache(source_realm_id);
CREATE INDEX idx_routing_cache_target ON routing_cache(target_capability_ref);
CREATE INDEX idx_routing_cache_expires ON routing_cache(expires_at);

-- ============================================
-- Audit Log Table
-- ============================================
CREATE TABLE audit_log (
    id BIGSERIAL PRIMARY KEY,
    
    entity_type VARCHAR(50) NOT NULL,  -- 'capability', 'contract', 'realm'
    entity_id VARCHAR(255) NOT NULL,
    action VARCHAR(50) NOT NULL,       -- 'created', 'updated', 'deleted', 'validated'
    
    actor VARCHAR(255),                -- Who performed the action
    details JSONB,
    
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_log_action ON audit_log(action);
CREATE INDEX idx_audit_log_timestamp ON audit_log(timestamp DESC);
CREATE INDEX idx_audit_log_actor ON audit_log(actor);

-- ============================================
-- Functions and Triggers
-- ============================================

-- Update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for capabilities
CREATE TRIGGER update_capabilities_updated_at
    BEFORE UPDATE ON capabilities
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for contracts
CREATE TRIGGER update_contracts_updated_at
    BEFORE UPDATE ON contracts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
    entity_id_value VARCHAR(255);
BEGIN
    -- Determine the entity_id based on the table
    IF TG_TABLE_NAME = 'capabilities' THEN
        IF (TG_OP = 'DELETE') THEN
            entity_id_value := OLD.capability_id;
        ELSE
            entity_id_value := NEW.capability_id;
        END IF;
    ELSIF TG_TABLE_NAME = 'contracts' THEN
        IF (TG_OP = 'DELETE') THEN
            entity_id_value := OLD.realm_id;
        ELSE
            entity_id_value := NEW.realm_id;
        END IF;
    ELSE
        entity_id_value := 'unknown';
    END IF;

    IF (TG_OP = 'INSERT') THEN
        INSERT INTO audit_log (entity_type, entity_id, action, details)
        VALUES (TG_TABLE_NAME, entity_id_value, 'created', row_to_json(NEW));
        RETURN NEW;
    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO audit_log (entity_type, entity_id, action, details)
        VALUES (TG_TABLE_NAME, entity_id_value, 'updated', row_to_json(NEW));
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        INSERT INTO audit_log (entity_type, entity_id, action, details)
        VALUES (TG_TABLE_NAME, entity_id_value, 'deleted', row_to_json(OLD));
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Audit triggers
CREATE TRIGGER audit_capabilities
    AFTER INSERT OR UPDATE OR DELETE ON capabilities
    FOR EACH ROW
    EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_contracts
    AFTER INSERT OR UPDATE OR DELETE ON contracts
    FOR EACH ROW
    EXECUTE FUNCTION audit_trigger_function();

-- ============================================
-- Views for easier querying
-- ============================================

-- Latest capabilities view
CREATE VIEW latest_capabilities AS
SELECT DISTINCT ON (capability_id)
    id,
    capability_id,
    version,
    description,
    author,
    tags,
    stability,
    services_count,
    events_count,
    loops_count,
    loop_stacks_count,
    created_at
FROM capabilities
ORDER BY capability_id, created_at DESC;

-- Latest contracts view
CREATE VIEW latest_contracts AS
SELECT DISTINCT ON (realm_id)
    id,
    realm_id,
    version,
    description,
    provides_services_count,
    provides_events_count,
    requires_services_count,
    requires_events_count,
    is_valid,
    created_at
FROM contracts
ORDER BY realm_id, created_at DESC;

-- Capability resources view (all resources across all capabilities)
CREATE VIEW capability_resources AS
SELECT 
    c.capability_id || '/v' || c.version || '/' || cs.name AS full_ref,
    c.capability_id,
    c.version,
    'service' AS resource_type,
    cs.name AS resource_name,
    cs.description,
    c.id AS capability_pk
FROM capabilities c
JOIN capability_services cs ON c.id = cs.capability_id

UNION ALL

SELECT 
    c.capability_id || '/v' || c.version || '/' || ce.name AS full_ref,
    c.capability_id,
    c.version,
    'event' AS resource_type,
    ce.name AS resource_name,
    ce.description,
    c.id AS capability_pk
FROM capabilities c
JOIN capability_events ce ON c.id = ce.capability_id

UNION ALL

SELECT 
    c.capability_id || '/v' || c.version || '/' || cl.name AS full_ref,
    c.capability_id,
    c.version,
    'loop' AS resource_type,
    cl.name AS resource_name,
    cl.description,
    c.id AS capability_pk
FROM capabilities c
JOIN capability_loops cl ON c.id = cl.capability_id

UNION ALL

SELECT 
    c.capability_id || '/v' || c.version || '/' || cls.name AS full_ref,
    c.capability_id,
    c.version,
    'loop_stack' AS resource_type,
    cls.name AS resource_name,
    cls.description,
    c.id AS capability_pk
FROM capabilities c
JOIN capability_loop_stacks cls ON c.id = cls.capability_id;

-- ============================================
-- Comments
-- ============================================
COMMENT ON TABLE capabilities IS 'Stores all capability definitions with full specs in JSONB';
COMMENT ON TABLE contracts IS 'Stores all realm contracts with full specs in JSONB';
COMMENT ON TABLE contract_bindings IS 'Extracted contract bindings for efficient routing queries';
COMMENT ON TABLE routing_cache IS 'Cached routing decisions for performance';
COMMENT ON TABLE audit_log IS 'Audit trail for all capability and contract changes';
COMMENT ON VIEW latest_capabilities IS 'Shows only the latest version of each capability';
COMMENT ON VIEW latest_contracts IS 'Shows only the latest version of each contract';
COMMENT ON VIEW capability_resources IS 'Unified view of all capability resources across all versions';