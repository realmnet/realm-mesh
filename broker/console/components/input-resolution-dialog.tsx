"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { CheckCircle2, Folder } from "lucide-react"
import type { ContractRequirement, TreeNode } from "@/lib/types"
import { cn } from "@/lib/utils"

interface InputResolutionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  requirement: ContractRequirement
  availableGateways: TreeNode[]
  onResolve: (gatewayId: string) => void
}

export function InputResolutionDialog({
  open,
  onOpenChange,
  requirement,
  availableGateways,
  onResolve,
}: InputResolutionDialogProps) {
  const [selectedGatewayId, setSelectedGatewayId] = useState<string | null>(null)

  const handleResolve = () => {
    if (selectedGatewayId) {
      onResolve(selectedGatewayId)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Resolve Input</DialogTitle>
          <DialogDescription>
            Select a gateway that provides the <span className="font-mono">{requirement.capability}</span> capability
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Requirement Details */}
          <Card className="bg-card/50 p-4">
            <h3 className="mb-2 text-sm font-semibold text-foreground">Required Capability</h3>
            <div className="space-y-2">
              <Badge variant="outline" className="font-mono">
                {requirement.capability}
              </Badge>
              {requirement.services && (
                <div className="text-xs text-muted-foreground">Services: {requirement.services.join(", ")}</div>
              )}
              {requirement.events && (
                <div className="text-xs text-muted-foreground">Events: {requirement.events.join(", ")}</div>
              )}
            </div>
          </Card>

          {/* Available Gateways */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-foreground">Available Gateways</h3>
            <div className="space-y-2">
              {availableGateways.map((gateway) => (
                <Card
                  key={gateway.id}
                  className={cn(
                    "cursor-pointer p-4 transition-colors hover:bg-card/80",
                    selectedGatewayId === gateway.id && "border-primary bg-primary/5",
                  )}
                  onClick={() => setSelectedGatewayId(gateway.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Folder className="h-5 w-5 text-yellow-500" />
                      <div>
                        <p className="font-mono text-sm font-medium text-foreground">{gateway.name}</p>
                        <p className="text-xs text-muted-foreground">Gateway • {gateway.status}</p>
                      </div>
                    </div>
                    {selectedGatewayId === gateway.id && <CheckCircle2 className="h-5 w-5 text-primary" />}
                  </div>
                </Card>
              ))}
              {availableGateways.length === 0 && (
                <Card className="border-dashed bg-card/50 p-8 text-center">
                  <p className="text-sm text-muted-foreground">No gateways available with this capability</p>
                </Card>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleResolve} disabled={!selectedGatewayId}>
            Resolve
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
