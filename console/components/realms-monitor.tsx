"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Activity, AlertCircle, CheckCircle, Clock, Network, Users, Plus, Server } from "lucide-react"
import { cn } from "@/lib/utils"
import { gatewayAPI, transformGatewayRealm } from "@/lib/api"
import { useWebSocket } from "@/lib/websocket-context"
import { CreateRealmModal } from "./create-realm-modal"

interface Realm {
  id: string
  name: string
  status: 'connected' | 'disconnected' | 'degraded'
  capabilities: string[]
  servicesCount: number
  agentsCount: number
  activeLoops: number
  eventsPerMinute: number
  lastHeartbeat: string
  latency: number
}

interface LoopExecution {
  id: string
  name: string
  type: 'aggregation' | 'voting' | 'bidding' | 'consensus' | 'workflow'
  status: 'recruiting' | 'executing' | 'aggregating' | 'completed' | 'failed'
  initiator: string
  participants: string[]
  startTime: string
  progress: number
}

export function RealmsMonitor() {
  const { realms, loops, loading, error, refreshRealms, isConnected } = useWebSocket()
  const [selectedRealm, setSelectedRealm] = useState<string | null>(null)
  const [createModalOpen, setCreateModalOpen] = useState(false)

  const monitorId = useState(() => Math.random().toString(36).substr(2, 9))[0]

  console.log(`📊 [RealmsMonitor-${monitorId}] Component rendered, realms: ${realms.length}, loops: ${loops.length}, loading: ${loading}, error: ${error}, connected: ${isConnected}`)

  useEffect(() => {
    console.log(`📊 [RealmsMonitor-${monitorId}] Component mounted`)
    return () => {
      console.log(`📊 [RealmsMonitor-${monitorId}] Component unmounting`)
    }
  }, [monitorId])

  useEffect(() => {
    console.log(`📊 [RealmsMonitor-${monitorId}] CreateModal state changed: ${createModalOpen}`)
  }, [createModalOpen, monitorId])

  const getStatusIcon = (status: Realm['status']) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'degraded':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      case 'disconnected':
        return <AlertCircle className="h-4 w-4 text-red-500" />
    }
  }

  const getLoopStatusColor = (status: LoopExecution['status']) => {
    switch (status) {
      case 'recruiting': return 'bg-blue-500'
      case 'executing': return 'bg-yellow-500'
      case 'aggregating': return 'bg-purple-500'
      case 'completed': return 'bg-green-500'
      case 'failed': return 'bg-red-500'
    }
  }

  const handleCreateRealm = async (newRealm: any) => {
    console.log(`📊 [RealmsMonitor-${monitorId}] handleCreateRealm called with:`, newRealm)
    try {
      // Create realm in gateway
      console.log(`📊 [RealmsMonitor-${monitorId}] Creating realm in gateway...`)
      await gatewayAPI.createRealm({
        id: newRealm.name.toLowerCase().replace(/\s+/g, '-'),
        parent_id: newRealm.parent || null,
        policies: []
      })

      console.log(`📊 [RealmsMonitor-${monitorId}] Realm created successfully, closing modal`)
      // Close modal
      setCreateModalOpen(false)

      console.log(`📊 [RealmsMonitor-${monitorId}] Refreshing realms list...`)
      // Refresh realms list using context
      await refreshRealms()
      console.log(`📊 [RealmsMonitor-${monitorId}] Realms refresh completed`)
    } catch (err) {
      console.error(`📊 [RealmsMonitor-${monitorId}] Failed to create realm:`, err)
      alert('Failed to create realm. Make sure the gateway is running.')
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading realms...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-2">Failed to connect to gateway</p>
          <p className="text-sm text-muted-foreground">{error}</p>
          <div className="flex items-center justify-center gap-2 mt-2">
            <div className={cn(
              "h-2 w-2 rounded-full",
              isConnected ? "bg-green-500" : "bg-red-500"
            )} />
            <p className="text-xs text-muted-foreground">
              WebSocket: {isConnected ? 'Connected' : 'Disconnected'}
            </p>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Make sure the gateway is running on localhost:3001
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full">
      {/* Realms List */}
      <div className="w-96 border-r border-border bg-card/50 p-4 overflow-auto">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-semibold">Connected Realms</h3>
              <div className={cn(
                "h-2 w-2 rounded-full",
                isConnected ? "bg-green-500" : "bg-red-500"
              )} />
            </div>
            <p className="text-sm text-muted-foreground">
              {realms.filter(r => r.status === 'connected').length} of {realms.length} online
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-1"
          >
            <Plus className="h-3 w-3" />
            Add
          </Button>
        </div>

        {realms.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Server className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-sm text-muted-foreground mb-1">No realms connected</p>
            <p className="text-xs text-muted-foreground mb-4">
              Create a realm or start an agent to begin
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCreateModalOpen(true)}
              className="flex items-center gap-1"
            >
              <Plus className="h-3 w-3" />
              Create Realm
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {realms.map(realm => (
              <Card
                key={realm.id}
                className={cn(
                  "cursor-pointer transition-colors",
                  selectedRealm === realm.id && "ring-2 ring-primary"
                )}
                onClick={() => setSelectedRealm(realm.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(realm.status)}
                      <CardTitle className="text-sm">{realm.name}</CardTitle>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {realm.latency}ms
                    </Badge>
                  </div>
                  <CardDescription className="text-xs">
                    {realm.id}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-3">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1">
                      <Network className="h-3 w-3 text-muted-foreground" />
                      <span>{realm.servicesCount} services</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3 text-muted-foreground" />
                      <span>{realm.agentsCount} agents</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Activity className="h-3 w-3 text-muted-foreground" />
                      <span>{realm.eventsPerMinute} evt/min</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span>{realm.activeLoops} loops</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-6 overflow-auto">
        {selectedRealm ? (
          <RealmDetails realm={realms.find(r => r.id === selectedRealm)!} />
        ) : realms.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Server className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Welcome to RealmMesh</h2>
              <p className="text-muted-foreground mb-4">
                Start by creating a realm or running the demo agents
              </p>
              <Button onClick={() => setCreateModalOpen(true)}>
                Create Your First Realm
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Mesh Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Mesh Overview</CardTitle>
                <CardDescription>
                  Real-time status of the RealmMesh network
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <p className="text-2xl font-bold">{realms.length}</p>
                    <p className="text-sm text-muted-foreground">Total Realms</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-2xl font-bold">
                      {realms.reduce((acc, r) => acc + r.servicesCount, 0)}
                    </p>
                    <p className="text-sm text-muted-foreground">Active Services</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-2xl font-bold">
                      {realms.reduce((acc, r) => acc + r.agentsCount, 0)}
                    </p>
                    <p className="text-sm text-muted-foreground">Active Agents</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-2xl font-bold">
                      {realms.reduce((acc, r) => acc + r.eventsPerMinute, 0)}
                    </p>
                    <p className="text-sm text-muted-foreground">Events/min</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Active Loops */}
            {loops.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Active Loop Executions</CardTitle>
                  <CardDescription>
                    Multi-agent coordination loops currently in progress
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {loops.map(loop => (
                      <div key={loop.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Badge className={getLoopStatusColor(loop.status)}>
                              {loop.status}
                            </Badge>
                            <div>
                              <p className="font-medium">{loop.name}</p>
                              <p className="text-xs text-muted-foreground">
                                Type: {loop.type} | Initiator: {loop.initiator}
                              </p>
                            </div>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {loop.participants.length} participants
                          </div>
                        </div>
                        <Progress value={loop.progress} className="h-2" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Create Realm Modal */}
      <CreateRealmModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onCreateRealm={handleCreateRealm}
        existingRealms={realms}
      />
    </div>
  )
}

function RealmDetails({ realm }: { realm: Realm }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">{realm.name}</h2>
        <p className="text-muted-foreground">{realm.id}</p>
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
                <AlertCircle className="h-5 w-5 text-yellow-500" />
              )}
              <span className="capitalize">{realm.status}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Latency</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{realm.latency}ms</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Event Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{realm.eventsPerMinute}/min</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Capabilities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {realm.capabilities.map(cap => (
              <Badge key={cap} variant="secondary">
                {cap}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Services ({realm.servicesCount})</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              View and manage services provided by this realm
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Agents ({realm.agentsCount})</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              AI agents available for loop participation
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}