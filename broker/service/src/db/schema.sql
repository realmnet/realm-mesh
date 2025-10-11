-- ============================================
-- RealmMesh PostgreSQL Schema
-- ============================================

-- Drop existing tables (be careful in production!)
DROP TABLE IF EXISTS realm_services CASCADE;
DROP TABLE IF EXISTS realm_events CASCADE;
DROP TABLE IF EXISTS realm_policies CASCADE;
DROP TABLE IF EXISTS policies CASCADE;
DROP TABLE IF EXISTS realms CASCADE;

-- ============================================
-- Realms Table - Tree structure with inheritance
-- ============================================
CREATE TABLE realms (
  id VARCHAR(255) PRIMARY KEY,
  parent_id VARCHAR(255) REFERENCES realms(id) ON DELETE CASCADE,
  name VARCHAR(255),
  description TEXT,
  route_to VARCHAR(500),  -- Internal routing URL if different from ID
  auth_token VARCHAR(500), -- Optional auth token for this realm
  policies TEXT[] DEFAULT '{}',
  inherit_policies BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_realms_parent ON realms(parent_id);
CREATE INDEX idx_realms_policies ON realms USING GIN(policies);

-- ============================================
-- Policy Definitions (reusable)
-- ============================================
CREATE TABLE policies (
  name VARCHAR(100) PRIMARY KEY,
  description TEXT,
  type VARCHAR(50), -- 'auth', 'rate-limit', 'access', 'audit', etc.
  config JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- Realm Services (dynamic runtime registry)
-- ============================================
CREATE TABLE realm_services (
  realm_id VARCHAR(255) REFERENCES realms(id) ON DELETE CASCADE,
  service_name VARCHAR(255) NOT NULL,
  capability VARCHAR(255),
  metadata JSONB DEFAULT '{}',
  registered_at TIMESTAMP DEFAULT NOW(),
  last_seen TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (realm_id, service_name)
);

CREATE INDEX idx_realm_services_realm ON realm_services(realm_id);
CREATE INDEX idx_realm_services_capability ON realm_services(capability);

-- ============================================
-- Realm Events (event topics and subscriptions)
-- ============================================
CREATE TABLE realm_events (
  realm_id VARCHAR(255) REFERENCES realms(id) ON DELETE CASCADE,
  event_topic VARCHAR(255) NOT NULL,
  event_type VARCHAR(50), -- 'publisher' or 'subscriber'
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (realm_id, event_topic, event_type)
);

CREATE INDEX idx_realm_events_realm ON realm_events(realm_id);
CREATE INDEX idx_realm_events_topic ON realm_events(event_topic);

-- ============================================
-- Audit Log (optional but useful)
-- ============================================
CREATE TABLE audit_log (
  id SERIAL PRIMARY KEY,
  timestamp TIMESTAMP DEFAULT NOW(),
  from_realm VARCHAR(255),
  to_realm VARCHAR(255),
  message_type VARCHAR(50),
  capability VARCHAR(255),
  service VARCHAR(255),
  success BOOLEAN,
  latency_ms INTEGER,
  metadata JSONB
);

CREATE INDEX idx_audit_timestamp ON audit_log(timestamp DESC);
CREATE INDEX idx_audit_from_realm ON audit_log(from_realm);
CREATE INDEX idx_audit_to_realm ON audit_log(to_realm);

-- ============================================
-- Default Realm Tree (removed - no auto-seeding)
-- ============================================

-- No default realms - they will be created dynamically

-- ============================================
-- Insert Policy Definitions
-- ============================================

INSERT INTO policies (name, description, type, config) VALUES
('require-auth', 'Require authentication token', 'auth', '{"type": "bearer", "header": "Authorization"}'),
('require-mtls', 'Require mutual TLS', 'auth', '{"type": "mtls", "verify_depth": 2}'),
('trusted', 'Trusted internal service', 'trust', '{"level": "high"}'),
('full-access', 'Full access to all services', 'access', '{"scope": "*"}'),
('no-auth', 'No authentication required', 'auth', '{"type": "none"}'),
('rate-limit-5', 'Rate limit 5 req/min', 'rate-limit', '{"limit": 5, "window": 60}'),
('rate-limit-10', 'Rate limit 10 req/min', 'rate-limit', '{"limit": 10, "window": 60}'),
('rate-limit-50', 'Rate limit 50 req/min', 'rate-limit', '{"limit": 50, "window": 60}'),
('rate-limit-100', 'Rate limit 100 req/min', 'rate-limit', '{"limit": 100, "window": 60}'),
('rate-limit-1000', 'Rate limit 1000 req/min', 'rate-limit', '{"limit": 1000, "window": 60}'),
('pci-compliant', 'PCI DSS compliant service', 'compliance', '{"standard": "PCI-DSS", "level": 1}'),
('cache-enabled', 'Response caching enabled', 'performance', '{"ttl": 300, "max_size": "100MB"}'),
('validate-hmac', 'Validate HMAC signature', 'security', '{"algorithm": "sha256", "header": "X-Signature"}'),
('audit-all', 'Audit all requests', 'audit', '{"level": "full", "include_payload": true}');

-- ============================================
-- Useful Queries
-- ============================================

-- Get realm with all inherited policies
CREATE OR REPLACE VIEW realm_effective_policies AS
WITH RECURSIVE realm_tree AS (
  SELECT id, parent_id, policies, inherit_policies, 0 as level
  FROM realms
  WHERE inherit_policies = true
  UNION ALL
  SELECT r.id, r.parent_id, r.policies, r.inherit_policies, rt.level + 1
  FROM realms r
  INNER JOIN realm_tree rt ON r.id = rt.parent_id
  WHERE r.inherit_policies = true
)
SELECT
  id,
  array_agg(DISTINCT policy ORDER BY policy) as effective_policies
FROM realm_tree, unnest(policies) as policy
GROUP BY id;

-- Get realm tree structure
CREATE OR REPLACE VIEW realm_tree_view AS
WITH RECURSIVE realm_tree AS (
  SELECT id, parent_id, name, 0 as depth, ARRAY[id] as path
  FROM realms
  WHERE parent_id IS NULL
  UNION ALL
  SELECT r.id, r.parent_id, r.name, rt.depth + 1, rt.path || r.id
  FROM realms r
  INNER JOIN realm_tree rt ON r.parent_id = rt.id
)
SELECT
  repeat('  ', depth) || id as tree_view,
  id,
  parent_id,
  name,
  depth,
  path
FROM realm_tree
ORDER BY path;

-- Get realm access matrix (who can call whom)
CREATE OR REPLACE FUNCTION can_realm_access(from_realm VARCHAR, to_realm VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
  from_policies TEXT[];
  from_namespace VARCHAR;
  to_namespace VARCHAR;
BEGIN
  -- Get effective policies for from_realm
  SELECT effective_policies INTO from_policies
  FROM realm_effective_policies
  WHERE id = from_realm;

  -- Check explicit allow
  IF ARRAY['allow:' || to_realm] && from_policies THEN
    RETURN true;
  END IF;

  -- Check wildcard allow
  IF ARRAY['allow:*'] && from_policies THEN
    RETURN true;
  END IF;

  -- Check namespace-level access
  from_namespace := split_part(from_realm, '.', 1) || '.' || split_part(from_realm, '.', 2);
  to_namespace := split_part(to_realm, '.', 1) || '.' || split_part(to_realm, '.', 2);

  IF from_namespace = to_namespace THEN
    RETURN true;
  END IF;

  -- Check pattern-based policies
  FOR i IN 1..array_length(from_policies, 1) LOOP
    IF from_policies[i] LIKE 'allow:%' THEN
      -- Simple pattern matching (could be more sophisticated)
      IF to_realm LIKE replace(replace(from_policies[i], 'allow:', ''), '*', '%') THEN
        RETURN true;
      END IF;
    END IF;
  END LOOP;

  RETURN false;
END;
$$ LANGUAGE plpgsql;