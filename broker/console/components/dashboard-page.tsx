"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  GitBranch,
  CheckCircle2,
  XCircle,
  Clock,
  Rocket,
  Activity,
  Network,
  MessageSquare,
  TrendingUp,
  AlertCircle,
} from "lucide-react"
import type { Deployment, RoutingNode, RoutingEdge, MessageStreamEntry } from "@/lib/types"

// Mock data for deployments
const mockDeployments: Deployment[] = [
  {
    id: "deploy_001",
    branch: "main",
    status: "deployed",
    createdAt: new Date("2025-01-09T10:00:00"),
    createdBy: "ops-team",
    validatedAt: new Date("2025-01-09T10:05:00"),
    deployedAt: new Date("2025-01-09T10:10:00"),
    changes: { added: 0, modified: 2, deleted: 0 },
    k8sNamespace: "production",
  },
  {
    id: "deploy_002",
    branch: "feature/payment-v2",
    status: "valid",
    createdAt: new Date("2025-01-09T14:00:00"),
    createdBy: "dev-team",
    validatedAt: new Date("2025-01-09T14:05:00"),
    changes: { added: 1, modified: 1, deleted: 0 },
    k8sNamespace: "feature-payment-v2",
  },
  {
    id: "deploy_003",
    branch: "feature/analytics",
    status: "validating",
    createdAt: new Date("2025-01-09T15:30:00"),
    createdBy: "analytics-team",
    changes: { added: 2, modified: 0, deleted: 0 },
  },
]

// Mock data for routing graph
const mockRoutingNodes: RoutingNode[] = [
  { id: "root", name: "Root", type: "gateway", status: "active", x: 400, y: 50 },
  { id: "finance", name: "Finance Gateway", type: "gateway", status: "active", x: 200, y: 200 },
  { id: "marketing", name: "Marketing Gateway", type: "gateway", status: "active", x: 600, y: 200 },
  { id: "payment-pod", name: "Payment Processor", type: "pod", status: "active", x: 150, y: 350 },
  { id: "stripe-bridge", name: "Stripe Bridge", type: "bridge", status: "connected", x: 250, y: 350 },
]

const mockRoutingEdges: RoutingEdge[] = [
  { id: "e1", source: "root", target: "finance", capability: "routing.local", messageCount: 1250 },
  { id: "e2", source: "root", target: "marketing", capability: "routing.local", messageCount: 890 },
  { id: "e3", source: "finance", target: "payment-pod", capability: "payment-processing", messageCount: 450 },
  { id: "e4", source: "payment-pod", target: "stripe-bridge", capability: "external.stripe", messageCount: 420 },
  { id: "e5", source: "marketing", target: "finance", capability: "payment-processing", messageCount: 120 },
]

// Mock data for message stream
const mockMessages: MessageStreamEntry[] = [
  {
    id: "msg_001",
    timestamp: new Date(),
    source: "marketing-gateway",
    target: "finance-gateway",
    capability: "finance.payment-processing",
    service: "process-payment",
    status: "success",
    latency: 45,
  },
  {
    id: "msg_002",
    timestamp: new Date(Date.now() - 1000),
    source: "payment-processor",
    target: "stripe-bridge",
    capability: "external.stripe",
    service: "create-charge",
    status: "success",
    latency: 120,
  },
  {
    id: "msg_003",
    timestamp: new Date(Date.now() - 2000),
    source: "finance-gateway",
    target: "payment-processor",
    capability: "finance.payment-processing",
    event: "payment.completed",
    status: "success",
    latency: 12,
  },
]

export function DashboardPage() {
  const [selectedDeployment, setSelectedDeployment] = useState<string | null>(null)

  const getStatusIcon = (status: Deployment["status"]) => {
    switch (status) {
      case "deployed":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case "valid":
        return <CheckCircle2 className="h-4 w-4 text-blue-500" />
      case "invalid":
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "validating":
      case "deploying":
        return <Clock className="h-4 w-4 text-yellow-500 animate-pulse" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: Deployment["status"]) => {
    switch (status) {
      case "deployed":
        return "bg-green-500/10 text-green-500 border-green-500/20"
      case "valid":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20"
      case "invalid":
      case "failed":
        return "bg-red-500/10 text-red-500 border-red-500/20"
      case "validating":
      case "deploying":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20"
    }
  }

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 px-6 py-4 backdrop-blur-sm">
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">RealmMesh deployment and monitoring overview</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <Tabs defaultValue="deployments" className="h-full">
          <TabsList>
            <TabsTrigger value="deployments">
              <Rocket className="mr-2 h-4 w-4" />
              Deployments
            </TabsTrigger>
            <TabsTrigger value="routing">
              <Network className="mr-2 h-4 w-4" />
              Routing Graph
            </TabsTrigger>
            <TabsTrigger value="messages">
              <MessageSquare className="mr-2 h-4 w-4" />
              Message Stream
            </TabsTrigger>
          </TabsList>

          {/* Deployments Tab */}
          <TabsContent value="deployments" className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Branch Deployments</h2>
                <p className="text-sm text-muted-foreground">Validate and deploy RealmMesh configurations</p>
              </div>
              <Button>
                <GitBranch className="mr-2 h-4 w-4" />
                Create Deployment
              </Button>
            </div>

            <div className="grid gap-4">
              {mockDeployments.map((deployment) => (
                <Card
                  key={deployment.id}
                  className="cursor-pointer p-4 transition-colors hover:bg-accent/50"
                  onClick={() => setSelectedDeployment(deployment.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {getStatusIcon(deployment.status)}
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{deployment.branch}</h3>
                          <Badge variant="outline" className={getStatusColor(deployment.status)}>
                            {deployment.status}
                          </Badge>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Created by {deployment.createdBy} • {deployment.createdAt.toLocaleString()}
                        </p>
                        <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
                          <span className="text-green-500">+{deployment.changes.added} added</span>
                          <span className="text-yellow-500">~{deployment.changes.modified} modified</span>
                          <span className="text-red-500">-{deployment.changes.deleted} deleted</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {deployment.status === "valid" && (
                        <Button size="sm" variant="default">
                          <Rocket className="mr-2 h-3 w-3" />
                          Deploy
                        </Button>
                      )}
                      {deployment.status === "pending" && (
                        <Button size="sm" variant="outline">
                          <CheckCircle2 className="mr-2 h-3 w-3" />
                          Validate
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Routing Graph Tab */}
          <TabsContent value="routing" className="mt-6">
            <div className="mb-4">
              <h2 className="text-lg font-semibold">Real-Time Routing Topology</h2>
              <p className="text-sm text-muted-foreground">Visual representation of mesh routing and connections</p>
            </div>

            <Card className="p-6">
              <div className="relative h-[500px] w-full rounded-lg border border-border bg-card/30">
                <svg className="h-full w-full">
                  {/* Render edges */}
                  {mockRoutingEdges.map((edge) => {
                    const source = mockRoutingNodes.find((n) => n.id === edge.source)
                    const target = mockRoutingNodes.find((n) => n.id === edge.target)
                    if (!source || !target) return null

                    return (
                      <g key={edge.id}>
                        <line
                          x1={source.x}
                          y1={source.y}
                          x2={target.x}
                          y2={target.y}
                          stroke="currentColor"
                          strokeWidth="2"
                          className="text-primary/30"
                        />
                        <text
                          x={(source.x! + target.x!) / 2}
                          y={(source.y! + target.y!) / 2}
                          className="fill-muted-foreground text-xs"
                          textAnchor="middle"
                        >
                          {edge.messageCount}/s
                        </text>
                      </g>
                    )
                  })}

                  {/* Render nodes */}
                  {mockRoutingNodes.map((node) => (
                    <g key={node.id}>
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r="30"
                        className={
                          node.status === "active" || node.status === "connected"
                            ? "fill-primary/20 stroke-primary"
                            : "fill-red-500/20 stroke-red-500"
                        }
                        strokeWidth="2"
                      />
                      <text
                        x={node.x}
                        y={node.y! + 50}
                        className="fill-foreground text-xs font-medium"
                        textAnchor="middle"
                      >
                        {node.name}
                      </text>
                    </g>
                  ))}
                </svg>
              </div>

              <div className="mt-4 flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-primary" />
                  <span className="text-muted-foreground">Active</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-500" />
                  <span className="text-muted-foreground">Error</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <span className="text-muted-foreground">2,680 messages/sec</span>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Message Stream Tab */}
          <TabsContent value="messages" className="mt-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Real-Time Message Stream</h2>
                <p className="text-sm text-muted-foreground">Live message flow through the mesh</p>
              </div>
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 animate-pulse text-green-500" />
                <span className="text-sm text-muted-foreground">Live</span>
              </div>
            </div>

            <Card className="p-4">
              <div className="space-y-2">
                {mockMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className="flex items-center justify-between rounded-lg border border-border bg-card/50 p-3 text-sm"
                  >
                    <div className="flex items-center gap-3">
                      {msg.status === "success" ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : msg.status === "error" ? (
                        <XCircle className="h-4 w-4 text-red-500" />
                      ) : (
                        <Clock className="h-4 w-4 text-yellow-500" />
                      )}
                      <div>
                        <div className="font-medium">
                          {msg.source} → {msg.target}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {msg.capability} • {msg.service || msg.event}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{msg.latency}ms</span>
                      <span>{msg.timestamp.toLocaleTimeString()}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <AlertCircle className="h-3 w-3" />
                <span>Showing last 50 messages • Auto-refresh enabled</span>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
