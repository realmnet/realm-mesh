-- Initial schema for control-plane database
-- Canvas management tables

CREATE TABLE canvas (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    layout VARCHAR(50) DEFAULT 'grid',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE canvas_node (
    id BIGSERIAL PRIMARY KEY,
    canvas_id BIGINT NOT NULL REFERENCES canvas(id) ON DELETE CASCADE,
    node_id VARCHAR(255) NOT NULL,
    node_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    position_x DECIMAL(10,2),
    position_y DECIMAL(10,2),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(canvas_id, node_id)
);

CREATE TABLE canvas_edge (
    id BIGSERIAL PRIMARY KEY,
    canvas_id BIGINT NOT NULL REFERENCES canvas(id) ON DELETE CASCADE,
    source_node_id VARCHAR(255) NOT NULL,
    target_node_id VARCHAR(255) NOT NULL,
    edge_type VARCHAR(50) DEFAULT 'data',
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (canvas_id, source_node_id) REFERENCES canvas_node(canvas_id, node_id),
    FOREIGN KEY (canvas_id, target_node_id) REFERENCES canvas_node(canvas_id, node_id)
);

-- Indexes for performance
CREATE INDEX idx_canvas_node_canvas_id ON canvas_node(canvas_id);
CREATE INDEX idx_canvas_edge_canvas_id ON canvas_edge(canvas_id);
CREATE INDEX idx_canvas_edge_source ON canvas_edge(source_node_id);
CREATE INDEX idx_canvas_edge_target ON canvas_edge(target_node_id);