"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Activity, AlertCircle, CheckCircle, Clock, Network, Users, Plus, Server } from "lucide-react"
import { cn } from "@/lib/utils"
import { gatewayAPI, transformGatewayRealm } from "@/lib/api"
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
  const [realms, setRealms] = useState<Realm[]>([])
  const [activeLoops, setActiveLoops] = useState<LoopExecution[]>([])
  const [selectedRealm, setSelectedRealm] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [createModalOpen, setCreateModalOpen] = useState(false)

  // Fetch real data from gateway and setup WebSocket
  useEffect(() => {
    let mounted = true
    let ws: WebSocket | null = null

    async function fetchData() {
      try {
        setLoading(true)
        setError(null)

        const gatewayRealms = await gatewayAPI.getRealms()

        if (!mounted) return

        const transformedRealms = gatewayRealms.map(transformGatewayRealm)
        setRealms(transformedRealms)

        // TODO: Fetch real loop data when available
        setActiveLoops([
          {
            id: "loop-001",
            name: "Sample Loop",
            type: "aggregation",
            status: "executing",
            initiator: "sample.realm",
            participants: [],
            startTime: new Date().toISOString(),
            progress: 45
          }
        ])
      } catch (err) {
        if (!mounted) return

        console.error('Failed to fetch realms:', err)
        setError(err instanceof Error ? err.message : 'Failed to load data')

        // Fall back to empty state
        setRealms([])
        setActiveLoops([])
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    // Setup WebSocket for real-time updates
    function setupWebSocket() {
      try {
        ws = gatewayAPI.createWebSocket()

        ws.onopen = () => {
          console.log('Connected to gateway WebSocket')
        }

        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data)

            switch (message.type) {
              case 'initial-state':
                if (mounted && message.payload.realms) {
                  const transformedRealms = message.payload.realms.map(transformGatewayRealm)
                  setRealms(transformedRealms)
                  setLoading(false)
                }
                break

              case 'realm-connected':
                if (mounted) {
                  setRealms(prev => {
                    const updated = [...prev]
                    const existingIndex = updated.findIndex(r => r.id === message.payload.realmId)
                    const newRealm = transformGatewayRealm({
                      id: message.payload.realmId,
                      status: 'connected',
                      services: message.payload.services || [],
                      capabilities: message.payload.capabilities || [],
                      connectedAt: message.payload.connectedAt
                    })

                    if (existingIndex >= 0) {
                      updated[existingIndex] = newRealm
                    } else {
                      updated.push(newRealm)
                    }
                    return updated
                  })
                }
                break

              case 'realm-disconnected':
                if (mounted) {
                  setRealms(prev => prev.filter(r => r.id !== message.payload.realmId))
                }
                break
            }
          } catch (err) {
            console.error('Failed to parse WebSocket message:', err)
          }
        }

        ws.onerror = (error) => {
          console.error('WebSocket error:', error)
        }

        ws.onclose = () => {
          console.log('WebSocket connection closed')
          // Reconnect after 5 seconds
          if (mounted) {
            setTimeout(setupWebSocket, 5000)
          }
        }
      } catch (err) {
        console.error('Failed to setup WebSocket:', err)
        // Fall back to polling
        const interval = setInterval(fetchData, 10000)
        return () => clearInterval(interval)
      }
    }

    // Initial fetch
    fetchData().then(() => {
      if (mounted) {
        setupWebSocket()
      }
    })

    return () => {
      mounted = false
      if (ws) {
        ws.close()
      }
    }
  }, [])

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
    try {
      // Create realm in gateway
      await gatewayAPI.createRealm({
        id: newRealm.id,
        parent_id: newRealm.parent || null,
        policies: []
      })

      // Close modal
      setCreateModalOpen(false)

      // Refresh realms list
      const gatewayRealms = await gatewayAPI.getRealms()
      const transformedRealms = gatewayRealms.map(transformGatewayRealm)
      setRealms(transformedRealms)
    } catch (err) {
      console.error('Failed to create realm:', err)
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
            <h3 className="text-lg font-semibold">Connected Realms</h3>
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
            <Card>
              <CardHeader>
                <CardTitle>Active Loop Executions</CardTitle>
                <CardDescription>
                  Multi-agent coordination loops currently in progress
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activeLoops.map(loop => (
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
          </div>
        )}
      </div>
    </div>
          ))}
        </div>
        )}
      </div>

      {/* Main Content Area - kept the same */}
      <div className="flex-1 p-6 overflow-auto">
        {/* ... existing content ... */}
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