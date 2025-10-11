import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react"
import type { Realm } from "@/lib/types"

interface ContractsTabProps {
  realm: Realm
}

export function ContractsTab({ realm }: ContractsTabProps) {
  // Mock contract fulfillment data
  const contracts = [
    {
      capability: "mesh.control",
      status: "fulfilled",
      provider: realm.type === "root" ? "self" : "realm_root_001",
      consumers: ["realm_gw_001", "realm_bridge_001"],
    },
    {
      capability: "routing.local",
      status: "fulfilled",
      provider: realm.type === "gateway" ? "self" : "realm_gw_001",
      consumers: ["realm_compute_001", "realm_compute_002"],
    },
    {
      capability: "ai.inference",
      status: "partial",
      provider: "realm_compute_001",
      consumers: ["external_clients"],
    },
  ]

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "fulfilled":
        return <CheckCircle2 className="h-4 w-4 text-success" />
      case "partial":
        return <AlertCircle className="h-4 w-4 text-warning" />
      case "unfulfilled":
        return <XCircle className="h-4 w-4 text-destructive" />
      default:
        return null
    }
  }

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <h3 className="mb-4 text-lg font-semibold text-foreground">Contract Fulfillment</h3>
        <div className="space-y-3">
          {contracts.map((contract) => (
            <div
              key={contract.capability}
              className="flex items-start gap-4 rounded-lg border border-border bg-muted/50 p-4"
            >
              <div className="mt-0.5">{getStatusIcon(contract.status)}</div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="font-mono">
                    {contract.capability}
                  </Badge>
                  <Badge
                    variant={
                      contract.status === "fulfilled"
                        ? "default"
                        : contract.status === "partial"
                          ? "secondary"
                          : "destructive"
                    }
                  >
                    {contract.status}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  <div>
                    <span className="font-medium">Provider:</span>{" "}
                    <span className="font-mono">{contract.provider}</span>
                  </div>
                  <div>
                    <span className="font-medium">Consumers:</span>{" "}
                    {contract.consumers.map((c, i) => (
                      <span key={c}>
                        <span className="font-mono">{c}</span>
                        {i < contract.consumers.length - 1 && ", "}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="mb-4 text-lg font-semibold text-foreground">Message Policies</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between rounded-md bg-muted/50 p-3">
            <span className="text-muted-foreground">Routing Strategy</span>
            <span className="font-mono text-foreground">recursive</span>
          </div>
          <div className="flex justify-between rounded-md bg-muted/50 p-3">
            <span className="text-muted-foreground">Policy Enforcement</span>
            <span className="font-mono text-foreground">strict</span>
          </div>
          <div className="flex justify-between rounded-md bg-muted/50 p-3">
            <span className="text-muted-foreground">Max Hops</span>
            <span className="font-mono text-foreground">8</span>
          </div>
        </div>
      </Card>
    </div>
  )
}
