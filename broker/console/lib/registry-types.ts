/**
 * TypeScript types generated from OpenAPI schemas
 * for RealmMesh Control Plane and InterRealm Protocol
 */

// ============================================
// Core Message & Mesh Types
// ============================================

export interface MessageEnvelope {
  messageId: string
  sourceRealm: string
  targetRealm: string
  messageType: "service-request" | "service-response" | "event" | "loop-message"
  capabilityRef?: string
  timestamp: string
  correlationId?: string
  headers?: Record<string, any>
  payload: Record<string, any>
}

export interface MeshInfo {
  uuid: string
  name: string
  version: string
  environment: string
}

export interface ErrorDetail {
  code: string
  message: string
  details?: Record<string, any>
}

// ============================================
// Capability Types
// ============================================

export type StabilityLevel = "experimental" | "beta" | "stable" | "deprecated"

export interface CapabilityMetadata {
  author?: string
  tags?: string[]
  stability?: StabilityLevel
  documentation?: string
}

export interface DomainObject {
  name: string
  description?: string
  schema: Record<string, any>
  examples?: Record<string, any>[]
}

export interface SchemaReference {
  domainObjectRef?: string
  externalRef?: string
  inlineSchema?: Record<string, any>
  description?: string
  optional?: boolean
}

export interface ErrorDefinition {
  code: string
  httpStatus?: number
  schema?: SchemaReference
}

export interface Service {
  name: string
  description?: string
  timeout?: number
  retries?: number
  idempotent?: boolean
  input?: SchemaReference
  output?: SchemaReference
  errors?: ErrorDefinition[]
}

export interface FilterDefinition {
  field: string
  description?: string
}

export interface EventDefinition {
  name: string
  description?: string
  topic: string
  ordering?: boolean
  payload?: SchemaReference
  filters?: FilterDefinition[]
}

export interface RecruitmentConfig {
  broadcastMessage?: SchemaReference
  recruitmentTimeout?: number
  minParticipants?: number
  maxParticipants?: number
}

export interface ExecutionConfig {
  participantContribution?: SchemaReference
  executionTimeout?: number
  waitStrategy?: "all" | "quorum" | "any"
}

export interface AggregationConfig {
  strategy?: "merge" | "sum" | "vote" | "rank" | "custom"
  quorum?: number
  customFunction?: string
}

export type LoopType = "aggregation" | "voting" | "bidding"

export interface Loop {
  name: string
  type: LoopType
  description?: string
  recruitment?: RecruitmentConfig
  execution?: ExecutionConfig
  aggregation?: AggregationConfig
  input?: SchemaReference
  output?: SchemaReference
}

export interface LoopStackStep {
  loopRef: string
  condition?: string
  allowSubLoops?: boolean
}

export interface LoopStack {
  name: string
  description?: string
  input?: SchemaReference
  output?: SchemaReference
  loops: LoopStackStep[]
}

export interface Capability {
  id: string
  version: string
  description?: string
  metadata?: CapabilityMetadata
  domainObjects?: DomainObject[]
  services?: Service[]
  events?: EventDefinition[]
  loops?: Loop[]
  loopStacks?: LoopStack[]
}

// ============================================
// Contract Types
// ============================================

export interface ServiceBinding {
  capabilityRef: string
  endpoint?: string
  configuration?: Record<string, any>
}

export interface EventBinding {
  capabilityRef: string
  configuration?: {
    filters?: Array<{
      field: string
      values: string[]
    }>
    partitions?: number
    retentionDays?: number
  }
}

export interface LoopBinding {
  capabilityRef: string
  configuration?: Record<string, any>
}

export interface LoopStackBinding {
  capabilityRef: string
  configuration?: Record<string, any>
}

export interface ContractProvides {
  services?: ServiceBinding[]
  events?: EventBinding[]
  loops?: LoopBinding[]
  loopStacks?: LoopStackBinding[]
}

export interface ContractRequires {
  services?: ServiceBinding[]
  events?: EventBinding[]
}

export interface Contract {
  realmId: string
  version: string
  description?: string
  provides?: ContractProvides
  requires?: ContractRequires
}

// ============================================
// API Response Types
// ============================================

export interface CapabilitySummary {
  id: string
  version: string
  description?: string
  author?: string
  tags?: string[]
  stability?: StabilityLevel
  servicesCount?: number
  eventsCount?: number
  loopsCount?: number
}

export interface ContractSummary {
  realmId: string
  version: string
  description?: string
  providesCount?: number
  requiresCount?: number
  createdAt?: string
}

export interface ContractValidationIssue {
  type: "missing_capability" | "gateway_blocked" | "invalid_reference"
  severity: "error" | "warning"
  message: string
  capabilityRef?: string
  suggestedAction?: string
}

export interface ContractValidationResult {
  valid: boolean
  realmId: string
  issues?: ContractValidationIssue[]
  fulfillmentMap?: Record<string, string[]>
}

// ============================================
// Bridge Types
// ============================================

export type BridgeType = "interrealm" | "service" | "grpc" | "graphql" | "event" | "database"
export type BridgeStatus = "connected" | "disconnected" | "error" | "configuring"

export interface ServiceBridgeConfig {
  baseUrl: string
  authentication?: {
    type: "bearer" | "basic" | "apikey" | "oauth2"
    credentials: Record<string, string>
  }
  timeout?: number
  retries?: number
  headers?: Record<string, string>
}

export interface InterRealmBridgeConfig {
  targetMeshId: string
  targetMeshUrl: string
  authentication?: {
    type: "mtls" | "jwt" | "apikey"
    credentials: Record<string, string>
  }
  contractMappings: Array<{
    localCapabilityRef: string
    remoteCapabilityRef: string
  }>
}

export interface EventBridgeConfig {
  provider: "kafka" | "rabbitmq" | "pubsub" | "sqs"
  connectionString: string
  topics?: string[]
  consumerGroup?: string
}

export interface Bridge {
  id: string
  name: string
  type: BridgeType
  status: BridgeStatus
  gatewayId: string
  description?: string
  config: ServiceBridgeConfig | InterRealmBridgeConfig | EventBridgeConfig | Record<string, any>
  exposedServices: string[]
  exposedEvents: string[]
  createdAt: Date
  lastHealthCheck?: Date
}

export interface RouteTableEntry {
  capabilityRef: string
  targetGatewayId: string
  allowedSourceGateways: string[]
  priority: number
}
