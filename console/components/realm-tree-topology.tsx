"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  ChevronDown,
  ChevronRight,
  Circle,
  Database,
  Globe,
  Lock,
  Plus,
  Settings,
  Shield,
  Users,
  Network,
  Activity,
  Clock,
  AlertCircle,
  CheckCircle
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useWebSocket } from "@/lib/websocket-context"

interface RealmNode {
  id: string
  parent_id: string | null
  name: string
  description?: string
  policies: string[]
  depth: number
  path: string[]
  children?: RealmNode[]
  // Runtime status
  status: 'connected' | 'disconnected' | 'degraded'
  services: string[]
  capabilities: string[]
  connectedAt?: string
  isExternal?: boolean
}

interface RealmMetrics {
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
}

export function RealmTreeTopology() {
  const { realms: wsRealms, isConnected } = useWebSocket()
  const [realms, setRealms] = useState<RealmNode[]>([])
  const [selectedRealm, setSelectedRealm] = useState<RealmNode | null>(null)
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['mesh']))
  const [metrics, setMetrics] = useState<RealmMetrics | null>(null)

  const topologyId = useState(() => Math.random().toString(36).substr(2, 9))[0]

  console.log(`🌐 [RealmTreeTopology-${topologyId}] Component rendered, connected: ${isConnected}, wsRealms: ${wsRealms.length}`)

  // Convert WebSocket realms to topology format
  useEffect(() => {
    console.log(`🌐 [RealmTreeTopology-${topologyId}] Converting ${wsRealms.length} WebSocket realms to topology format`)

    const convertedRealms: RealmNode[] = wsRealms.map(realm => ({
      id: realm.id,
      parent_id: null, // We can enhance this later with proper hierarchy
      name: realm.id, // Use id as name for now
      description: `Realm ${realm.id}`,
      policies: [], // Initialize with empty policies array
      depth: 0,
      path: [realm.id],
      children: [],
      status: realm.status,
      services: realm.capabilities || [], // Use capabilities array as services
      capabilities: realm.capabilities || [],
      connectedAt: realm.lastHeartbeat,
      isExternal: false // Default to internal, can be enhanced
    }))

    setRealms(convertedRealms)
  }, [wsRealms, topologyId])

  // Load initial metrics from API (realms now come from WebSocket context)
  useEffect(() => {
    console.log(`🌐 [RealmTreeTopology-${topologyId}] Loading initial metrics`)
    loadMetrics()
  }, [topologyId])

  // Removed loadRealms - now using shared WebSocket context

  const loadMetrics = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/metrics', {
        headers: {
          'X-API-Key': process.env.NEXT_PUBLIC_ADMIN_API_KEY || 'admin-key-123'
        }
      })
      const data = await response.json()
      setMetrics(data)
    } catch (error) {
      console.error('Failed to load metrics:', error)
    }
  }

  const buildTree = (flatRealms: any[]): RealmNode[] => {
    const nodeMap = new Map<string, RealmNode>()

    // Create all nodes
    flatRealms.forEach(realm => {
      nodeMap.set(realm.id, {
        ...realm,
        children: []
      })
    })

    // Build tree structure
    const roots: RealmNode[] = []
    nodeMap.forEach(node => {
      if (node.parent_id) {
        const parent = nodeMap.get(node.parent_id)
        if (parent) {
          parent.children = parent.children || []
          parent.children.push(node)
        }
      } else {
        roots.push(node)
      }
    })

    return roots
  }

  // Removed status update functions - now using shared WebSocket context

  const toggleNode = (nodeId: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev)
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId)
      } else {
        newSet.add(nodeId)
      }
      return newSet
    })
  }

  const selectRealm = (realm: RealmNode) => {
    setSelectedRealm(realm)
  }

  const updateRealmPolicies = async (realmId: string, policies: string[]) => {
    try {
      await fetch(`http://localhost:3001/api/realms/${realmId}/policies`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': process.env.NEXT_PUBLIC_ADMIN_API_KEY || 'admin-key-123'
        },
        body: JSON.stringify({ policies })
      })
      // Realms will update automatically via WebSocket context
    } catch (error) {
      console.error('Failed to update policies:', error)
    }
  }

  const getNodeIcon = (node: RealmNode) => {
    if (node.isExternal) return <Globe className="h-4 w-4" />
    if (node.id === 'mesh') return <Network className="h-4 w-4" />
    if (node.id.startsWith('public')) return <Globe className="h-4 w-4" />
    if (node.id.startsWith('external')) return <Shield className="h-4 w-4" />
    if (node.children && node.children.length > 0) return <Database className="h-4 w-4" />
    return <Circle className="h-3 w-3" />
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return <CheckCircle className="h-3 w-3 text-green-500" />
      case 'degraded': return <AlertCircle className="h-3 w-3 text-yellow-500" />
      default: return <Circle className="h-3 w-3 text-gray-400" />
    }
  }

  const renderNode = (node: RealmNode) => {
    const hasChildren = node.children && node.children.length > 0
    const isExpanded = expandedNodes.has(node.id)
    const isSelected = selectedRealm?.id === node.id

    return (
      <div key={node.id} className="select-none">
        <div
          className={cn(
            "flex items-center gap-2 py-1 px-2 rounded cursor-pointer hover:bg-accent",
            isSelected && "bg-accent border border-primary"
          )}
          onClick={() => selectRealm(node)}
        >
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation()
                toggleNode(node.id)
              }}
              className="flex items-center justify-center w-4 h-4"
            >
              {isExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </button>
          ) : (
            <div className="w-4" />
          )}

          {getNodeIcon(node)}

          <span className="flex-1 text-sm font-medium">{node.name || node.id}</span>

          <div className="flex items-center gap-1">
            {getStatusIcon(node.status)}
            {node.services?.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {node.services.length}
              </Badge>
            )}
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div className="ml-4 border-l border-border">
            {node.children!.map(child => renderNode(child))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex h-full">
      {/* Tree Navigation */}
      <div className="w-80 border-r border-border bg-card/30 p-4 overflow-auto">
        <div className="mb-4">
          <h3 className="text-lg font-semibold">Realm Mesh</h3>
          {metrics && (
            <p className="text-sm text-muted-foreground">
              {metrics.connectedRealms} connected • {metrics.totalServices} services
            </p>
          )}
        </div>

        <div className="space-y-1">
          {realms.map(node => renderNode(node))}
        </div>

        <div className="mt-6 pt-4 border-t border-border">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => {
              // Add new realm functionality
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Realm
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 overflow-auto">
        {selectedRealm ? (
          <RealmDetailsView
            realm={selectedRealm}
            onUpdatePolicies={updateRealmPolicies}
          />
        ) : (
          <MeshOverview metrics={metrics} />
        )}
      </div>
    </div>
  )
}

function MeshOverview({ metrics }: { metrics: RealmMetrics | null }) {
  if (!metrics) return <div>Loading...</div>

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Mesh Overview</h2>
        <p className="text-muted-foreground">
          Real-time status of the RealmMesh network
        </p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Connected Realms</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{metrics.connectedRealms}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Active Services</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{metrics.totalServices}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Pending Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{metrics.pendingRequests}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Event Topics</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{metrics.eventTopics}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Realms</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {metrics.realms.map(realm => (
              <div key={realm.id} className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium">{realm.id}</p>
                  <p className="text-xs text-muted-foreground">
                    {realm.services} services • {realm.capabilities} capabilities
                    {realm.isExternal && ' • External'}
                  </p>
                </div>
                <div className="text-xs text-muted-foreground">
                  <Clock className="h-3 w-3 inline mr-1" />
                  {new Date(realm.connectedAt).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function RealmDetailsView({
  realm,
  onUpdatePolicies
}: {
  realm: RealmNode
  onUpdatePolicies: (realmId: string, policies: string[]) => void
}) {
  const [editingPolicies, setEditingPolicies] = useState(false)
  const [policiesText, setPoliciesText] = useState(realm.policies.join('\n'))

  const handleSavePolicies = () => {
    const newPolicies = policiesText.split('\n').filter(p => p.trim())
    onUpdatePolicies(realm.id, newPolicies)
    setEditingPolicies(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">{realm.name || realm.id}</h2>
        <p className="text-muted-foreground">{realm.description || realm.id}</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {realm.status === 'connected' ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <Circle className="h-5 w-5 text-gray-400" />
              )}
              <span className="capitalize">{realm.status}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Services</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{realm.services?.length || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Type</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={realm.isExternal ? "destructive" : "default"}>
              {realm.isExternal ? "External" : "Internal"}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Services */}
      {realm.services && realm.services.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Services</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {realm.services.map(service => (
                <Badge key={service} variant="secondary">
                  {service}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Capabilities */}
      {realm.capabilities && realm.capabilities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Capabilities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {realm.capabilities.map(cap => (
                <Badge key={cap} variant="outline">
                  {cap}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Policies */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Policies</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditingPolicies(!editingPolicies)}
            >
              <Settings className="h-4 w-4 mr-2" />
              {editingPolicies ? 'Cancel' : 'Edit'}
            </Button>
          </div>
          <CardDescription>
            Access control policies for this realm
          </CardDescription>
        </CardHeader>
        <CardContent>
          {editingPolicies ? (
            <div className="space-y-4">
              <Textarea
                value={policiesText}
                onChange={(e) => setPoliciesText(e.target.value)}
                placeholder="Enter policies (one per line)..."
                rows={6}
              />
              <div className="flex gap-2">
                <Button onClick={handleSavePolicies}>Save</Button>
                <Button
                  variant="outline"
                  onClick={() => setEditingPolicies(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {realm.policies.map(policy => (
                <Badge key={policy} variant="secondary">
                  {policy}
                </Badge>
              ))}
              {realm.policies.length === 0 && (
                <p className="text-muted-foreground">No policies defined</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}