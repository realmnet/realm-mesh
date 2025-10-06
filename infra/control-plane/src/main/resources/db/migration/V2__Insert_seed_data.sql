-- Seed data for canvas tables

INSERT INTO canvas (name, layout) VALUES
('Default Canvas', 'grid'),
('Sample Flow Canvas', 'flow'),
('Demo Canvas', 'grid');

-- Sample nodes for Default Canvas (id=1)
INSERT INTO canvas_node (canvas_id, node_id, node_type, status, position_x, position_y, metadata) VALUES
(1, 'input-1', 'input', 'active', 100.0, 100.0, '{"label": "Data Input", "config": {"type": "text"}}'),
(1, 'processor-1', 'processor', 'pending', 300.0, 100.0, '{"label": "Text Processor", "config": {"operation": "transform"}}'),
(1, 'output-1', 'output', 'inactive', 500.0, 100.0, '{"label": "Result Output", "config": {"format": "json"}}');

-- Sample edges for Default Canvas
INSERT INTO canvas_edge (canvas_id, source_node_id, target_node_id, edge_type, metadata) VALUES
(1, 'input-1', 'processor-1', 'data', '{"weight": 1.0}'),
(1, 'processor-1', 'output-1', 'data', '{"weight": 1.0}');