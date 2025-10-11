/**
 * Information about the RealmMesh cluster
 */
export interface MeshInfo {
  name: string
  uuid: string
  environment: "development" | "staging" | "production"
}

/**
 * Realm type definitions
 * - root: Foundational control domain with routing authority
 * - gateway: Organizes pods, agents, bridges; enforces policies; can contain sub-gateways
 * - pod: Execution environment for compute workloads (formerly compute realm)
 * - agent: Native RealmMesh agent (lightweight, no pod needed)
 */
export type RealmType = "root" | "gateway" | "pod" | "agent"

/**
 * Realm status definitions
 * - active: Fully operational
 * - degraded: Operational but with issues
 * - inactive: Not currently running
 * - error: Critical failure state
 * - pending: Awaiting deployment
 * - deploying: Currently being deployed
 */
export type RealmStatus = "active" | "degraded" | "inactive" | "error" | "pending" | "deploying"

/**
 * Core Realm entity representing a node in the RealmMesh hierarchy
 */
export interface Realm {
  id: string
  name: string
  type: RealmType
  status: RealmStatus
  replicas?: number
  parent: string | null
  image?: string
  providedCapabilities: string[]
  requiredCapabilities: string[]
  children: string[]
  bridges?: Bridge[]
  routeTable?: RouteTableEntry[]
  gateways?: string[] // IDs of child gateways (for recursive nesting)
}

/**
 * Connection between realms for message routing
 */
export interface RealmConnection {
  id: string
  sourceRealmId: string
  targetRealmId: string
  protocol: "grpc" | "http" | "websocket"
  status: "connected" | "disconnected" | "error"
  latency?: number
  messagesPerSecond?: number
}

/**
 * Contract definition for realm capabilities
 */
export interface RealmContract {
  capability: string
  version: string
  description: string
  required: boolean
}

/**
 * Log entry for realm events
 */
export interface RealmLogEntry {
  id: string
  timestamp: Date
  level: "info" | "warn" | "error" | "debug"
  message: string
  realmId: string
  metadata?: Record<string, unknown>
}

/**
 * Bridge type definitions - Protocol adapters for external systems
 * - interrealm: Connects to another RealmMesh cluster
 * - service: Wraps HTTP REST API as RealmMesh service
 * - grpc: Wraps gRPC service as RealmMesh service
 * - graphql: Wraps GraphQL API as RealmMesh service
 * - event: Connects to message queue (Kafka, RabbitMQ, etc.)
 * - database: Wraps database as RealmMesh service
 */
export type BridgeType = "interrealm" | "service" | "grpc" | "graphql" | "event" | "database"

/**
 * Bridge status definitions
 */
export type BridgeStatus = "connected" | "disconnected" | "error" | "configuring" | "pending"

/**
 * Service Bridge configuration for HTTP REST APIs
 */
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

/**
 * InterRealm Bridge configuration for RealmMesh-to-RealmMesh
 */
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

/**
 * Event Bridge configuration for message queues
 */
export interface EventBridgeConfig {
  provider: "kafka" | "rabbitmq" | "pubsub" | "sqs"
  connectionString: string
  topics?: string[]
  consumerGroup?: string
}

/**
 * Bridge entity representing external system adapter
 */
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

/**
 * Route table entry for cross-gateway routing
 */
export interface RouteTableEntry {
  capabilityRef: string
  targetGatewayId: string
  allowedSourceGateways: string[]
  priority: number
}

/**
 * Pending change tracking for GitOps workflow
 */
export interface PendingChange {
  id: string
  realmId: string
  type: "create" | "update" | "delete"
  data: Realm
  timestamp: Date
}

/**
 * Git branch information
 */
export interface GitBranch {
  name: string
  isDefault: boolean
  lastCommit: {
    sha: string
    message: string
    author: string
    timestamp: Date
  }
}

/**
 * GitOps validation result
 */
export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
}

export interface ValidationError {
  id: string
  nodeId: string // ID of the tree node with the error
  path: string
  message: string
  severity: "error"
  category: "contract" | "dependency" | "configuration" | "status"
}

export interface ValidationWarning {
  id: string
  nodeId: string // ID of the tree node with the warning
  path: string
  message: string
  severity: "warning"
  category: "contract" | "dependency" | "configuration" | "status"
}

export interface ValidationInfo {
  id: string
  nodeId: string
  path: string
  message: string
  severity: "info"
  category: "contract" | "dependency" | "configuration" | "status"
}

export type ValidationIssue = ValidationError | ValidationWarning | ValidationInfo

/**
 * Unified tree node type for GitOps tree view
 * - realm: Root realm node
 * - gateway: Gateway realm (can contain sub-gateways)
 * - folder: Organizational folder (capabilities/, contracts/, pods/, agents/, bridges/, gateways/)
 * - capability: Capability definition
 * - contract: Contract definition
 * - pod: Pod (compute workload)
 * - agent: Agent (native RealmMesh agent)
 * - bridge: Bridge (external system adapter)
 */
export type TreeNodeType = "realm" | "gateway" | "folder" | "capability" | "contract" | "pod" | "agent" | "bridge"

/**
 * Unified tree node for displaying all RealmMesh resources
 */
export interface TreeNode {
  id: string
  name: string
  type: TreeNodeType
  status?: RealmStatus | BridgeStatus
  parent: string | null
  children: string[]
  data: Realm | any // Will hold the actual resource data
  folderType?: "capabilities" | "contracts" | "pods" | "agents" | "bridges" | "gateways"
}

/**
 * Service definition in a contract
 */
export interface ContractService {
  name: string
  type: "rpc" | "stream"
  description?: string
}

/**
 * Event definition in a contract
 */
export interface ContractEvent {
  name: string
  type: "producer" | "consumer"
  description?: string
}

/**
 * Contract requirement (what a pod needs)
 */
export interface ContractRequirement {
  capability: string
  services?: string[]
  events?: string[]
  resolved?: boolean
  resolvedGateway?: string // Which gateway provides this
}

/**
 * Pod contract definition
 */
export interface PodContract {
  id: string
  name: string
  podId: string
  gatewayId: string
  provides: {
    capability: string
    services: ContractService[]
    events: ContractEvent[]
  }
  requires: ContractRequirement[]
  version: string
  description?: string
}

/**
 * Deployment status for branch-based deployments
 */
export type DeploymentStatus =
  | "pending"
  | "validating"
  | "valid"
  | "invalid"
  | "deploying"
  | "deployed"
  | "failed"
  | "rolled-back"

/**
 * Deployment entity for branch-based deployment workflow
 */
export interface Deployment {
  id: string
  branch: string
  status: DeploymentStatus
  createdAt: Date
  createdBy: string
  validatedAt?: Date
  deployedAt?: Date
  changes: {
    added: number
    modified: number
    deleted: number
  }
  validationErrors?: ValidationIssue[]
  k8sNamespace?: string
}

/**
 * Routing graph node for visualization
 */
export interface RoutingNode {
  id: string
  name: string
  type: "gateway" | "pod" | "bridge"
  status: RealmStatus | BridgeStatus
  x?: number
  y?: number
}

/**
 * Routing graph edge for visualization
 */
export interface RoutingEdge {
  id: string
  source: string
  target: string
  capability: string
  messageCount?: number
  latency?: number
}

/**
 * Message stream entry for real-time monitoring
 */
export interface MessageStreamEntry {
  id: string
  timestamp: Date
  source: string
  target: string
  capability: string
  service?: string
  event?: string
  status: "success" | "error" | "pending"
  latency?: number
  payload?: any
}
