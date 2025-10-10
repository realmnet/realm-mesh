"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Package, CheckCircle2, AlertCircle, Link2 } from "lucide-react"
import type { TreeNode, PodContract, ContractRequirement } from "@/lib/types"
import { cn } from "@/lib/utils"
import { InputResolutionDialog } from "./input-resolution-dialog"

interface PodDetailsProps {
  pod: TreeNode
  allNodes: TreeNode[]
}

// Mock contract data
const mockContract: PodContract = {
  id: "contract_payment_processor",
  name: "payment-processor-contract",
  podId: "pod_payment_processor",
  gatewayId: "realm_gw_finance",
  provides: {
    capability: "finance.payment-processing",
    services: [
      { name: "process-payment", type: "rpc", description: "Process a payment transaction" },
      { name: "refund-payment", type: "rpc", description: "Refund a payment" },
    ],
    events: [
      { name: "payment.completed", type: "producer", description: "Emitted when payment completes" },
      { name: "payment.failed", type: "producer", description: "Emitted when payment fails" },
    ],
  },
  requires: [
    {
      capability: "finance.invoice-management",
      services: ["get-invoice", "update-invoice"],
      resolved: true,
      resolvedGateway: "realm_gw_finance",
    },
    {
      capability: "external.stripe-api",
      services: ["charge-card"],
      resolved: false, // Unresolved!
    },
  ],
  version: "v1.0.0",
  description: "Payment processing pod contract",
}

export function PodDetails({ pod, allNodes }: PodDetailsProps) {
  const [selectedRequirement, setSelectedRequirement] = useState<ContractRequirement | null>(null)
  const [isResolutionDialogOpen, setIsResolutionDialogOpen] = useState(false)

  const unresolvedCount = mockContract.requires.filter((r) => !r.resolved).length

  const handleResolve = (requirement: ContractRequirement) => {
    setSelectedRequirement(requirement)
    setIsResolutionDialogOpen(true)
  }

  const handleResolutionComplete = (gatewayId: string) => {
    console.log("[v0] Resolved to gateway:", gatewayId)
    // TODO: Update contract with resolved gateway
    setIsResolutionDialogOpen(false)
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-border bg-card/50 px-6 py-4 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Package className="h-6 w-6 text-purple-500" />
          <div>
            <h2 className="text-lg font-semibold text-foreground">{pod.name}</h2>
            <p className="text-sm text-muted-foreground">Pod • {pod.data?.replicas || 1} replicas</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-6">
          {/* Overview */}
          <Card className="bg-card/50 p-4">
            <h3 className="mb-3 text-sm font-semibold text-foreground">Overview</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Image</span>
                <span className="font-mono text-foreground">{pod.data?.image || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Replicas</span>
                <span className="text-foreground">{pod.data?.replicas || 1}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs",
                    pod.status === "active" && "bg-green-500/10 text-green-500 border-green-500/20",
                  )}
                >
                  {pod.status}
                </Badge>
              </div>
            </div>
          </Card>

          {/* Contract - Provides */}
          <Card className="bg-card/50 p-4">
            <h3 className="mb-3 text-sm font-semibold text-foreground">Provides</h3>
            <div className="space-y-3">
              <div>
                <p className="mb-2 text-xs font-medium text-muted-foreground">Capability</p>
                <Badge variant="outline" className="font-mono text-xs">
                  {mockContract.provides.capability}
                </Badge>
              </div>
              <div>
                <p className="mb-2 text-xs font-medium text-muted-foreground">Services</p>
                <div className="space-y-1">
                  {mockContract.provides.services.map((service) => (
                    <div key={service.name} className="flex items-center gap-2 text-xs">
                      <span className="font-mono text-foreground">{service.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {service.type}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 text-xs font-medium text-muted-foreground">Events</p>
                <div className="space-y-1">
                  {mockContract.provides.events.map((event) => (
                    <div key={event.name} className="flex items-center gap-2 text-xs">
                      <span className="font-mono text-foreground">{event.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {event.type}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Contract - Requires (Input Resolution) */}
          <Card className="bg-card/50 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Requires</h3>
              {unresolvedCount > 0 && (
                <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 text-xs">
                  {unresolvedCount} unresolved
                </Badge>
              )}
            </div>
            <div className="space-y-3">
              {mockContract.requires.map((requirement) => (
                <div
                  key={requirement.capability}
                  className={cn(
                    "rounded-lg border p-3",
                    requirement.resolved
                      ? "border-green-500/20 bg-green-500/5"
                      : "border-yellow-500/20 bg-yellow-500/5",
                  )}
                >
                  <div className="mb-2 flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {requirement.resolved ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-yellow-500" />
                      )}
                      <span className="font-mono text-sm text-foreground">{requirement.capability}</span>
                    </div>
                    {!requirement.resolved && (
                      <Button size="sm" variant="outline" onClick={() => handleResolve(requirement)}>
                        <Link2 className="mr-1 h-3 w-3" />
                        Resolve
                      </Button>
                    )}
                  </div>
                  {requirement.services && (
                    <div className="ml-6 text-xs text-muted-foreground">
                      Services: {requirement.services.join(", ")}
                    </div>
                  )}
                  {requirement.resolved && requirement.resolvedGateway && (
                    <div className="ml-6 mt-1 flex items-center gap-1 text-xs text-green-500">
                      <CheckCircle2 className="h-3 w-3" />
                      Resolved to: {requirement.resolvedGateway}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Input Resolution Dialog */}
      {selectedRequirement && (
        <InputResolutionDialog
          open={isResolutionDialogOpen}
          onOpenChange={setIsResolutionDialogOpen}
          requirement={selectedRequirement}
          availableGateways={allNodes.filter((n) => n.type === "gateway")}
          onResolve={handleResolutionComplete}
        />
      )}
    </div>
  )
}
