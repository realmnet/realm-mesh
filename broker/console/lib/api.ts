/**
 * API service for connecting console to RealmMesh gateway
 */

const GATEWAY_BASE_URL = process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:3001'
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || 'admin-key-123'

class GatewayAPI {
  private baseURL: string
  private apiKey: string

  constructor(baseURL: string = GATEWAY_BASE_URL, apiKey: string = API_KEY) {
    this.baseURL = baseURL
    this.apiKey = apiKey
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}/api${endpoint}`

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey,
        ...options.headers,
      },
    })

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  // Get all realms with status
  async getRealms() {
    return this.request<any[]>('/realms')
  }

  // Create new realm
  async createRealm(realm: { id: string; parent_id?: string; policies?: string[] }) {
    return this.request('/realms', {
      method: 'POST',
      body: JSON.stringify(realm),
    })
  }

  // Update realm policies
  async updateRealmPolicies(realmId: string, policies: string[]) {
    return this.request(`/realms/${realmId}/policies`, {
      method: 'PUT',
      body: JSON.stringify({ policies }),
    })
  }

  // Get real-time metrics
  async getMetrics() {
    return this.request<{
      connectedRealms: number
      totalServices: number
      pendingRequests: number
      eventTopics: number
      realms: Array<{
        id: string
        services: number
        capabilities: number
        isExternal: boolean
        connectedAt: string
      }>
    }>('/metrics')
  }

  // Create WebSocket connection for real-time updates
  createWebSocket(): WebSocket {
    const wsUrl = this.baseURL.replace('http', 'ws')
    return new WebSocket(wsUrl)
  }
}

export const gatewayAPI = new GatewayAPI()

// Transform gateway realm data to console format
export function transformGatewayRealm(gatewayRealm: any) {
  return {
    id: gatewayRealm.id,
    name: gatewayRealm.id.split('.').pop() || gatewayRealm.id,
    status: gatewayRealm.status as 'connected' | 'disconnected' | 'degraded',
    capabilities: gatewayRealm.capabilities || [],
    servicesCount: gatewayRealm.services?.length || 0,
    agentsCount: 0, // Not tracked in gateway yet
    activeLoops: 0, // Not tracked in gateway yet
    eventsPerMinute: 0, // Not tracked in gateway yet
    lastHeartbeat: gatewayRealm.connectedAt || new Date().toISOString(),
    latency: Math.floor(Math.random() * 50) + 10, // Mock for now
  }
}

// Transform gateway metrics to console format
export function transformGatewayMetrics(gatewayMetrics: any) {
  return {
    connectedRealms: gatewayMetrics.connectedRealms,
    totalServices: gatewayMetrics.totalServices,
    pendingRequests: gatewayMetrics.pendingRequests,
    eventTopics: gatewayMetrics.eventTopics,
    realms: gatewayMetrics.realms.map(transformGatewayRealm),
  }
}