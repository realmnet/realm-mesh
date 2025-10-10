-- Migration: Client/Agent/Participant Model
-- Adds support for clients that provide agents which become loop participants

-- Clients table (applications/connections)
CREATE TABLE IF NOT EXISTS clients (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    realm_id UUID REFERENCES realms(id) ON DELETE CASCADE,
    auth_token VARCHAR(512) NOT NULL UNIQUE,
    connection_id VARCHAR(255),
    status VARCHAR(50) DEFAULT 'disconnected',
    last_connected TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Client capabilities (what this client provides)
CREATE TABLE IF NOT EXISTS client_capabilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id VARCHAR(255) REFERENCES clients(id) ON DELETE CASCADE,
    capability_type VARCHAR(50) NOT NULL, -- 'service', 'agent', 'loop', 'loopstack', 'event-handler'
    capability_name VARCHAR(255) NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(client_id, capability_type, capability_name)
);

-- Client agents (specific agent capabilities)
CREATE TABLE IF NOT EXISTS client_agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id VARCHAR(255) REFERENCES clients(id) ON DELETE CASCADE,
    agent_name VARCHAR(255) NOT NULL,
    participates_in TEXT[] DEFAULT '{}',
    skills TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(client_id, agent_name)
);

-- Client realm access control
CREATE TABLE IF NOT EXISTS client_realm_access (
    client_id VARCHAR(255) REFERENCES clients(id) ON DELETE CASCADE,
    realm_id UUID REFERENCES realms(id) ON DELETE CASCADE,
    access_granted BOOLEAN DEFAULT true,
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    granted_by VARCHAR(255),
    PRIMARY KEY (client_id, realm_id)
);

-- Loop states (tracking active loops)
CREATE TABLE IF NOT EXISTS loop_states (
    id VARCHAR(255) PRIMARY KEY,
    loop_name VARCHAR(255) NOT NULL,
    capability VARCHAR(255),
    initiator_client_id VARCHAR(255) REFERENCES clients(id) ON DELETE SET NULL,
    phase VARCHAR(50) DEFAULT 'recruitment', -- recruitment, execution, aggregation, complete, failed
    input JSONB,
    result JSONB,
    recruitment_timeout INTEGER,
    execution_timeout INTEGER,
    min_participants INTEGER,
    max_participants INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- Loop participants (agents participating in loops)
CREATE TABLE IF NOT EXISTS loop_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loop_id VARCHAR(255) REFERENCES loop_states(id) ON DELETE CASCADE,
    client_id VARCHAR(255) REFERENCES clients(id) ON DELETE CASCADE,
    agent_name VARCHAR(255) NOT NULL,
    participant_id VARCHAR(512) NOT NULL, -- composite: client_id.agent_name
    status VARCHAR(50) DEFAULT 'recruited', -- recruited, executing, complete, failed
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_execution_at TIMESTAMP,
    completed_at TIMESTAMP,
    result JSONB,
    error TEXT,
    UNIQUE(loop_id, participant_id)
);

-- Event subscriptions
CREATE TABLE IF NOT EXISTS event_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id VARCHAR(255) REFERENCES clients(id) ON DELETE CASCADE,
    topic VARCHAR(255) NOT NULL,
    handler_name VARCHAR(255),
    filters JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(client_id, topic, handler_name)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_clients_realm ON clients(realm_id);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_client_capabilities_client ON client_capabilities(client_id);
CREATE INDEX IF NOT EXISTS idx_client_capabilities_type ON client_capabilities(capability_type);
CREATE INDEX IF NOT EXISTS idx_client_agents_client ON client_agents(client_id);
CREATE INDEX IF NOT EXISTS idx_client_realm_access_client ON client_realm_access(client_id);
CREATE INDEX IF NOT EXISTS idx_client_realm_access_realm ON client_realm_access(realm_id);
CREATE INDEX IF NOT EXISTS idx_loop_states_phase ON loop_states(phase);
CREATE INDEX IF NOT EXISTS idx_loop_states_created ON loop_states(created_at);
CREATE INDEX IF NOT EXISTS idx_loop_participants_loop ON loop_participants(loop_id);
CREATE INDEX IF NOT EXISTS idx_loop_participants_client ON loop_participants(client_id);
CREATE INDEX IF NOT EXISTS idx_loop_participants_status ON loop_participants(status);
CREATE INDEX IF NOT EXISTS idx_event_subscriptions_client ON event_subscriptions(client_id);
CREATE INDEX IF NOT EXISTS idx_event_subscriptions_topic ON event_subscriptions(topic);

-- Triggers for timestamp updates
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_loop_states_updated_at BEFORE UPDATE ON loop_states
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Helper function to get client's agents
CREATE OR REPLACE FUNCTION get_client_agents(client_uuid VARCHAR(255))
RETURNS TABLE(agent_name VARCHAR(255), participates_in TEXT[], skills TEXT[]) AS $$
BEGIN
    RETURN QUERY
    SELECT ca.agent_name, ca.participates_in, ca.skills
    FROM client_agents ca
    WHERE ca.client_id = client_uuid;
END;
$$ LANGUAGE plpgsql;

-- Helper function to find clients with specific agent capability
CREATE OR REPLACE FUNCTION find_clients_with_agent(loop_name_param VARCHAR(255))
RETURNS TABLE(client_id VARCHAR(255), agent_name VARCHAR(255)) AS $$
BEGIN
    RETURN QUERY
    SELECT ca.client_id, ca.agent_name
    FROM client_agents ca
    WHERE loop_name_param = ANY(ca.participates_in)
    AND EXISTS (
        SELECT 1 FROM clients c
        WHERE c.id = ca.client_id
        AND c.status = 'connected'
    );
END;
$$ LANGUAGE plpgsql;
