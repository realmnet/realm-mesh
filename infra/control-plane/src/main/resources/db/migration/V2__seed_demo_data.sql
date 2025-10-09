-- ============================================
-- Flyway Migration: V2__seed_demo_data.sql
-- ============================================
-- Demo Use Case: Healthcare Drug Interaction Analysis
-- 
-- Scenario:
-- - pharmacy realm provides drug query services
-- - research realm provides clinical trial data
-- - ai-analysis realm runs drug interaction checks using loops
-- - patient-care realm subscribes to drug recall events
-- ============================================

-- ============================================
-- CAPABILITY 1: Common Types (Foundational)
-- ============================================
INSERT INTO capabilities (
    capability_id,
    version,
    description,
    author,
    tags,
    stability,
    documentation_url,
    spec,
    services_count,
    events_count,
    loops_count,
    loop_stacks_count,
    domain_objects_count,
    created_by
) VALUES (
    'common.types',
    '1.0.0',
    'Common foundational types used across capabilities',
    'Platform Team',
    ARRAY['common', 'foundation', 'shared'],
    'stable',
    'https://docs.interrealm.io/capabilities/common-types',
    '{
        "domainObjects": [
            {
                "name": "Address",
                "description": "Standard address structure",
                "schema": {
                    "type": "object",
                    "required": ["street1", "city", "state", "postalCode"],
                    "properties": {
                        "street1": {"type": "string"},
                        "street2": {"type": "string"},
                        "city": {"type": "string"},
                        "state": {"type": "string", "minLength": 2, "maxLength": 2},
                        "postalCode": {"type": "string", "pattern": "^[0-9]{5}(-[0-9]{4})?$"},
                        "country": {"type": "string", "default": "US"}
                    }
                }
            },
            {
                "name": "Money",
                "description": "Currency amount",
                "schema": {
                    "type": "object",
                    "required": ["currency", "amountCents"],
                    "properties": {
                        "currency": {"type": "string", "pattern": "^[A-Z]{3}$"},
                        "amountCents": {"type": "integer"}
                    }
                }
            }
        ]
    }'::jsonb,
    0,
    0,
    0,
    0,
    2,
    'seed_data'
);

-- Extract domain objects
INSERT INTO capability_domain_objects (capability_id, name, description, schema)
SELECT 
    c.id,
    'Address',
    'Standard address structure',
    '{"type": "object", "required": ["street1", "city", "state", "postalCode"]}'::jsonb
FROM capabilities c WHERE c.capability_id = 'common.types' AND c.version = '1.0.0';

INSERT INTO capability_domain_objects (capability_id, name, description, schema)
SELECT 
    c.id,
    'Money',
    'Currency amount',
    '{"type": "object", "required": ["currency", "amountCents"]}'::jsonb
FROM capabilities c WHERE c.capability_id = 'common.types' AND c.version = '1.0.0';

-- ============================================
-- CAPABILITY 2: Healthcare Pharmacy
-- ============================================
INSERT INTO capabilities (
    capability_id,
    version,
    description,
    author,
    tags,
    stability,
    documentation_url,
    spec,
    services_count,
    events_count,
    loops_count,
    loop_stacks_count,
    domain_objects_count,
    created_by
) VALUES (
    'healthcare.pharmacy',
    '2.1.0',
    'Pharmacy and drug management capabilities including FDA data',
    'Healthcare Platform Team',
    ARRAY['healthcare', 'pharmacy', 'fda', 'drugs'],
    'stable',
    'https://docs.interrealm.io/capabilities/healthcare-pharmacy',
    '{
        "domainObjects": [
            {
                "name": "Drug",
                "description": "Drug information",
                "schema": {
                    "type": "object",
                    "required": ["ndcCode", "name"],
                    "properties": {
                        "ndcCode": {"type": "string", "pattern": "^[0-9]{5}-[0-9]{4}-[0-9]{2}$"},
                        "name": {"type": "string"},
                        "genericName": {"type": "string"},
                        "manufacturer": {"type": "string"},
                        "form": {"type": "string", "enum": ["tablet", "capsule", "liquid", "injection"]}
                    }
                }
            }
        ],
        "services": [
            {
                "name": "DrugQuery",
                "description": "Query drug information by NDC code",
                "timeout": 5000,
                "retries": 3,
                "idempotent": true,
                "input": {
                    "domainObjectRef": "DrugQueryRequest"
                },
                "output": {
                    "domainObjectRef": "DrugQueryResponse"
                }
            }
        ],
        "events": [
            {
                "name": "DrugRecalled",
                "description": "Emitted when FDA recalls a drug",
                "topic": "drug.recalled",
                "ordering": true,
                "payload": {
                    "inlineSchema": {
                        "type": "object",
                        "required": ["recallId", "ndcCode", "severity"],
                        "properties": {
                            "recallId": {"type": "string"},
                            "ndcCode": {"type": "string"},
                            "severity": {"type": "string", "enum": ["class1", "class2", "class3"]},
                            "reason": {"type": "string"}
                        }
                    }
                },
                "filters": [
                    {"field": "severity", "description": "Filter by recall severity"}
                ]
            }
        ],
        "loops": [
            {
                "name": "DrugInteractionCheck",
                "type": "aggregation",
                "description": "Check drug interactions across multiple data sources",
                "recruitment": {
                    "recruitmentTimeout": 5000,
                    "minParticipants": 2
                },
                "execution": {
                    "executionTimeout": 30000,
                    "waitStrategy": "all"
                },
                "aggregation": {
                    "strategy": "merge"
                }
            }
        ]
    }'::jsonb,
    1,
    1,
    1,
    0,
    1,
    'seed_data'
);

-- Extract services
INSERT INTO capability_services (capability_id, name, description, timeout, retries, idempotent, full_ref)
SELECT 
    c.id,
    'DrugQuery',
    'Query drug information by NDC code',
    5000,
    3,
    true,
    'healthcare.pharmacy/v2.1.0/DrugQuery'
FROM capabilities c WHERE c.capability_id = 'healthcare.pharmacy' AND c.version = '2.1.0';

-- Extract events
INSERT INTO capability_events (capability_id, name, topic, description, ordering, full_ref)
SELECT 
    c.id,
    'DrugRecalled',
    'drug.recalled',
    'Emitted when FDA recalls a drug',
    true,
    'healthcare.pharmacy/v2.1.0/DrugRecalled'
FROM capabilities c WHERE c.capability_id = 'healthcare.pharmacy' AND c.version = '2.1.0';

-- Extract loops
INSERT INTO capability_loops (capability_id, name, type, description, full_ref)
SELECT 
    c.id,
    'DrugInteractionCheck',
    'aggregation',
    'Check drug interactions across multiple data sources',
    'healthcare.pharmacy/v2.1.0/DrugInteractionCheck'
FROM capabilities c WHERE c.capability_id = 'healthcare.pharmacy' AND c.version = '2.1.0';

-- ============================================
-- CAPABILITY 3: Healthcare Research
-- ============================================
INSERT INTO capabilities (
    capability_id,
    version,
    description,
    author,
    tags,
    stability,
    spec,
    services_count,
    events_count,
    loops_count,
    loop_stacks_count,
    domain_objects_count,
    created_by
) VALUES (
    'healthcare.research',
    '1.0.0',
    'Clinical research and trials data',
    'Research Team',
    ARRAY['healthcare', 'research', 'clinical-trials'],
    'beta',
    '{
        "services": [
            {
                "name": "ClinicalTrialQuery",
                "description": "Query clinical trial data",
                "timeout": 10000,
                "retries": 2,
                "idempotent": true
            }
        ],
        "events": [
            {
                "name": "TrialResultsPublished",
                "description": "New trial results available",
                "topic": "trial.results.published",
                "ordering": false
            }
        ]
    }'::jsonb,
    1,
    1,
    0,
    0,
    0,
    'seed_data'
);

-- Extract services
INSERT INTO capability_services (capability_id, name, description, timeout, retries, idempotent, full_ref)
SELECT 
    c.id,
    'ClinicalTrialQuery',
    'Query clinical trial data',
    10000,
    2,
    true,
    'healthcare.research/v1.0.0/ClinicalTrialQuery'
FROM capabilities c WHERE c.capability_id = 'healthcare.research' AND c.version = '1.0.0';

-- Extract events
INSERT INTO capability_events (capability_id, name, topic, description, ordering, full_ref)
SELECT 
    c.id,
    'TrialResultsPublished',
    'trial.results.published',
    'New trial results available',
    false,
    'healthcare.research/v1.0.0/TrialResultsPublished'
FROM capabilities c WHERE c.capability_id = 'healthcare.research' AND c.version = '1.0.0';

-- ============================================
-- CONTRACT 1: Pharmacy Data Realm (Provider)
-- ============================================
INSERT INTO contracts (
    realm_id,
    version,
    description,
    spec,
    provides_services_count,
    provides_events_count,
    requires_services_count,
    requires_events_count,
    is_valid,
    created_by
) VALUES (
    'realm_pharmacy_data_001',
    '1.0.0',
    'Pharmacy data provider with drug database',
    '{
        "provides": {
            "services": [
                {
                    "capabilityRef": "healthcare.pharmacy/v2.1.0/DrugQuery",
                    "endpoint": "internal://drug-service:8080",
                    "configuration": {
                        "timeout": 3000,
                        "caching": true,
                        "cacheTimeout": 300000
                    }
                }
            ],
            "events": [
                {
                    "capabilityRef": "healthcare.pharmacy/v2.1.0/DrugRecalled",
                    "configuration": {
                        "partitions": 3,
                        "retentionDays": 90
                    }
                }
            ]
        },
        "requires": {}
    }'::jsonb,
    1,
    1,
    0,
    0,
    true,
    'seed_data'
);

-- Extract bindings for pharmacy realm
INSERT INTO contract_bindings (
    contract_id,
    binding_type,
    direction,
    capability_ref,
    capability_id,
    capability_version,
    resource_name,
    configuration,
    endpoint
)
SELECT 
    c.id,
    'service',
    'provides',
    'healthcare.pharmacy/v2.1.0/DrugQuery',
    'healthcare.pharmacy',
    'v2.1.0',
    'DrugQuery',
    '{"timeout": 3000, "caching": true, "cacheTimeout": 300000}'::jsonb,
    'internal://drug-service:8080'
FROM contracts c WHERE c.realm_id = 'realm_pharmacy_data_001' AND c.version = '1.0.0';

INSERT INTO contract_bindings (
    contract_id,
    binding_type,
    direction,
    capability_ref,
    capability_id,
    capability_version,
    resource_name,
    configuration
)
SELECT 
    c.id,
    'event',
    'provides',
    'healthcare.pharmacy/v2.1.0/DrugRecalled',
    'healthcare.pharmacy',
    'v2.1.0',
    'DrugRecalled',
    '{"partitions": 3, "retentionDays": 90}'::jsonb
FROM contracts c WHERE c.realm_id = 'realm_pharmacy_data_001' AND c.version = '1.0.0';

-- ============================================
-- CONTRACT 2: AI Analysis Realm (Consumer + Loop Participant)
-- ============================================
INSERT INTO contracts (
    realm_id,
    version,
    description,
    spec,
    provides_services_count,
    provides_loops_count,
    requires_services_count,
    requires_events_count,
    is_valid,
    created_by
) VALUES (
    'realm_ai_analysis_001',
    '1.0.0',
    'AI-powered drug interaction analysis',
    '{
        "provides": {
            "loops": [
                {
                    "capabilityRef": "healthcare.pharmacy/v2.1.0/DrugInteractionCheck",
                    "configuration": {
                        "participantRole": "analyzer",
                        "dataSource": "fda-database"
                    }
                }
            ]
        },
        "requires": {
            "services": [
                {
                    "capabilityRef": "healthcare.pharmacy/v2.1.0/DrugQuery",
                    "configuration": {
                        "timeout": 5000,
                        "retries": 3
                    }
                },
                {
                    "capabilityRef": "healthcare.research/v1.0.0/ClinicalTrialQuery",
                    "configuration": {
                        "timeout": 15000,
                        "retries": 2
                    }
                }
            ],
            "events": [
                {
                    "capabilityRef": "healthcare.research/v1.0.0/TrialResultsPublished",
                    "configuration": {
                        "consumerGroup": "ai-analysis-group"
                    }
                }
            ]
        }
    }'::jsonb,
    0,
    1,
    2,
    1,
    true,
    'seed_data'
);

-- Extract bindings for AI analysis realm
INSERT INTO contract_bindings (
    contract_id,
    binding_type,
    direction,
    capability_ref,
    capability_id,
    capability_version,
    resource_name,
    configuration
)
SELECT 
    c.id,
    'loop',
    'provides',
    'healthcare.pharmacy/v2.1.0/DrugInteractionCheck',
    'healthcare.pharmacy',
    'v2.1.0',
    'DrugInteractionCheck',
    '{"participantRole": "analyzer", "dataSource": "fda-database"}'::jsonb
FROM contracts c WHERE c.realm_id = 'realm_ai_analysis_001' AND c.version = '1.0.0';

INSERT INTO contract_bindings (
    contract_id,
    binding_type,
    direction,
    capability_ref,
    capability_id,
    capability_version,
    resource_name,
    configuration
)
SELECT 
    c.id,
    'service',
    'requires',
    'healthcare.pharmacy/v2.1.0/DrugQuery',
    'healthcare.pharmacy',
    'v2.1.0',
    'DrugQuery',
    '{"timeout": 5000, "retries": 3}'::jsonb
FROM contracts c WHERE c.realm_id = 'realm_ai_analysis_001' AND c.version = '1.0.0';

INSERT INTO contract_bindings (
    contract_id,
    binding_type,
    direction,
    capability_ref,
    capability_id,
    capability_version,
    resource_name,
    configuration
)
SELECT 
    c.id,
    'service',
    'requires',
    'healthcare.research/v1.0.0/ClinicalTrialQuery',
    'healthcare.research',
    'v1.0.0',
    'ClinicalTrialQuery',
    '{"timeout": 15000, "retries": 2}'::jsonb
FROM contracts c WHERE c.realm_id = 'realm_ai_analysis_001' AND c.version = '1.0.0';

INSERT INTO contract_bindings (
    contract_id,
    binding_type,
    direction,
    capability_ref,
    capability_id,
    capability_version,
    resource_name,
    configuration
)
SELECT 
    c.id,
    'event',
    'requires',
    'healthcare.research/v1.0.0/TrialResultsPublished',
    'healthcare.research',
    'v1.0.0',
    'TrialResultsPublished',
    '{"consumerGroup": "ai-analysis-group"}'::jsonb
FROM contracts c WHERE c.realm_id = 'realm_ai_analysis_001' AND c.version = '1.0.0';

-- ============================================
-- CONTRACT 3: Patient Care Realm (Event Consumer)
-- ============================================
INSERT INTO contracts (
    realm_id,
    version,
    description,
    spec,
    provides_services_count,
    requires_services_count,
    requires_events_count,
    is_valid,
    created_by
) VALUES (
    'realm_patient_care_001',
    '1.0.0',
    'Patient care system that monitors drug recalls',
    '{
        "provides": {},
        "requires": {
            "services": [
                {
                    "capabilityRef": "healthcare.pharmacy/v2.1.0/DrugQuery",
                    "configuration": {
                        "timeout": 3000
                    }
                }
            ],
            "events": [
                {
                    "capabilityRef": "healthcare.pharmacy/v2.1.0/DrugRecalled",
                    "configuration": {
                        "filters": [
                            {
                                "field": "severity",
                                "values": ["class1", "class2"],
                                "operator": "in"
                            }
                        ],
                        "consumerGroup": "patient-care-group",
                        "maxRetries": 5
                    }
                }
            ]
        }
    }'::jsonb,
    0,
    1,
    1,
    true,
    'seed_data'
);

-- Extract bindings for patient care realm
INSERT INTO contract_bindings (
    contract_id,
    binding_type,
    direction,
    capability_ref,
    capability_id,
    capability_version,
    resource_name,
    configuration
)
SELECT 
    c.id,
    'service',
    'requires',
    'healthcare.pharmacy/v2.1.0/DrugQuery',
    'healthcare.pharmacy',
    'v2.1.0',
    'DrugQuery',
    '{"timeout": 3000}'::jsonb
FROM contracts c WHERE c.realm_id = 'realm_patient_care_001' AND c.version = '1.0.0';

INSERT INTO contract_bindings (
    contract_id,
    binding_type,
    direction,
    capability_ref,
    capability_id,
    capability_version,
    resource_name,
    configuration
)
SELECT 
    c.id,
    'event',
    'requires',
    'healthcare.pharmacy/v2.1.0/DrugRecalled',
    'healthcare.pharmacy',
    'v2.1.0',
    'DrugRecalled',
    '{"filters": [{"field": "severity", "values": ["class1", "class2"], "operator": "in"}], "consumerGroup": "patient-care-group", "maxRetries": 5}'::jsonb
FROM contracts c WHERE c.realm_id = 'realm_patient_care_001' AND c.version = '1.0.0';

-- ============================================
-- CONTRACT 4: Research Data Realm (Provider)
-- ============================================
INSERT INTO contracts (
    realm_id,
    version,
    description,
    spec,
    provides_services_count,
    provides_events_count,
    requires_services_count,
    requires_events_count,
    is_valid,
    created_by
) VALUES (
    'realm_research_data_001',
    '1.0.0',
    'Clinical research data provider',
    '{
        "provides": {
            "services": [
                {
                    "capabilityRef": "healthcare.research/v1.0.0/ClinicalTrialQuery",
                    "endpoint": "internal://research-service:8080",
                    "configuration": {
                        "timeout": 10000
                    }
                }
            ],
            "events": [
                {
                    "capabilityRef": "healthcare.research/v1.0.0/TrialResultsPublished",
                    "configuration": {
                        "partitions": 2,
                        "retentionDays": 365
                    }
                }
            ]
        },
        "requires": {}
    }'::jsonb,
    1,
    1,
    0,
    0,
    true,
    'seed_data'
);

-- Extract bindings for research realm
INSERT INTO contract_bindings (
    contract_id,
    binding_type,
    direction,
    capability_ref,
    capability_id,
    capability_version,
    resource_name,
    configuration,
    endpoint
)
SELECT 
    c.id,
    'service',
    'provides',
    'healthcare.research/v1.0.0/ClinicalTrialQuery',
    'healthcare.research',
    'v1.0.0',
    'ClinicalTrialQuery',
    '{"timeout": 10000}'::jsonb,
    'internal://research-service:8080'
FROM contracts c WHERE c.realm_id = 'realm_research_data_001' AND c.version = '1.0.0';

INSERT INTO contract_bindings (
    contract_id,
    binding_type,
    direction,
    capability_ref,
    capability_id,
    capability_version,
    resource_name,
    configuration
)
SELECT 
    c.id,
    'event',
    'provides',
    'healthcare.research/v1.0.0/TrialResultsPublished',
    'healthcare.research',
    'v1.0.0',
    'TrialResultsPublished',
    '{"partitions": 2, "retentionDays": 365}'::jsonb
FROM contracts c WHERE c.realm_id = 'realm_research_data_001' AND c.version = '1.0.0';

-- ============================================
-- Seed Routing Cache (Example Routes)
-- ============================================
INSERT INTO routing_cache (
    source_realm_id,
    target_capability_ref,
    available_realms,
    gateway_path,
    expires_at
) VALUES 
(
    'realm_ai_analysis_001',
    'healthcare.pharmacy/v2.1.0/DrugQuery',
    ARRAY['realm_pharmacy_data_001'],
    ARRAY['gateway_healthcare_001'],
    NOW() + INTERVAL '1 hour'
),
(
    'realm_ai_analysis_001',
    'healthcare.research/v1.0.0/ClinicalTrialQuery',
    ARRAY['realm_research_data_001'],
    ARRAY['gateway_healthcare_001', 'gateway_research_001'],
    NOW() + INTERVAL '1 hour'
),
(
    'realm_patient_care_001',
    'healthcare.pharmacy/v2.1.0/DrugQuery',
    ARRAY['realm_pharmacy_data_001'],
    ARRAY['gateway_healthcare_001'],
    NOW() + INTERVAL '1 hour'
);

-- ============================================
-- Audit Log Entries
-- ============================================
INSERT INTO audit_log (entity_type, entity_id, action, actor, details) VALUES
('capabilities', 'common.types', 'created', 'seed_data', '{"version": "1.0.0"}'::jsonb),
('capabilities', 'healthcare.pharmacy', 'created', 'seed_data', '{"version": "2.1.0"}'::jsonb),
('capabilities', 'healthcare.research', 'created', 'seed_data', '{"version": "1.0.0"}'::jsonb),
('contracts', 'realm_pharmacy_data_001', 'created', 'seed_data', '{"version": "1.0.0"}'::jsonb),
('contracts', 'realm_ai_analysis_001', 'created', 'seed_data', '{"version": "1.0.0"}'::jsonb),
('contracts', 'realm_patient_care_001', 'created', 'seed_data', '{"version": "1.0.0"}'::jsonb),
('contracts', 'realm_research_data_001', 'created', 'seed_data', '{"version": "1.0.0"}'::jsonb);

-- ============================================
-- Summary View for Demo
-- ============================================
COMMENT ON TABLE capabilities IS 'Demo includes: common.types (foundation), healthcare.pharmacy (drug services), healthcare.research (clinical trials)';
COMMENT ON TABLE contracts IS 'Demo includes: 4 realms forming a healthcare drug interaction analysis system';

-- Show summary
DO $$
BEGIN
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'Demo Data Seeded Successfully!';
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'Capabilities: %', (SELECT COUNT(*) FROM capabilities);
    RAISE NOTICE 'Contracts: %', (SELECT COUNT(*) FROM contracts);
    RAISE NOTICE 'Contract Bindings: %', (SELECT COUNT(*) FROM contract_bindings);
    RAISE NOTICE '';
    RAISE NOTICE 'Use Case: Healthcare Drug Interaction Analysis';
    RAISE NOTICE '- realm_pharmacy_data_001: Provides drug data';
    RAISE NOTICE '- realm_research_data_001: Provides clinical trial data';
    RAISE NOTICE '- realm_ai_analysis_001: AI analysis (participates in loops)';
    RAISE NOTICE '- realm_patient_care_001: Monitors drug recalls';
    RAISE NOTICE '==============================================';
END $$;