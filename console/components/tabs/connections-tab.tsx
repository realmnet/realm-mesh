import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { RealmTypeIcon } from "../realm-type-icon"
import { ArrowRight, ArrowLeft } from "lucide-react"
import type { Realm } from "@/lib/types"

interface ConnectionsTabProps {
  realm: Realm
  allRealms: Realm[]
}

export function ConnectionsTab({ realm, allRealms }: ConnectionsTabProps) {
  const childRealms = allRealms.filter((r) => realm.children.includes(r.id))
  const parentRealm = allRealms.find((r) => r.id === realm.parent)

  return (
    <div className="space-y-4">
      {parentRealm && (
        <Card className="p-6">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Parent Connection
          </h3>
          <div className="rounded-lg border border-border bg-muted/50 p-4">
            <div className="flex items-center gap-3">
              <RealmTypeIcon type={parentRealm.type} className="h-5 w-5" />
              <div className="flex-1">
                <div className="font-medium text-foreground">{parentRealm.name}</div>
                <div className="font-mono text-xs text-muted-foreground">{parentRealm.id}</div>
              </div>
              <Badge variant="secondary" className="capitalize">
                {parentRealm.type}
              </Badge>
            </div>
          </div>
        </Card>
      )}

      {childRealms.length > 0 && (
        <Card className="p-6">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
            <ArrowRight className="h-4 w-4" />
            Child Connections ({childRealms.length})
          </h3>
          <div className="space-y-2">
            {childRealms.map((child) => (
              <div key={child.id} className="rounded-lg border border-border bg-muted/50 p-4">
                <div className="flex items-center gap-3">
                  <RealmTypeIcon type={child.type} className="h-5 w-5" />
                  <div className="flex-1">
                    <div className="font-medium text-foreground">{child.name}</div>
                    <div className="font-mono text-xs text-muted-foreground">{child.id}</div>
                  </div>
                  <Badge variant="secondary" className="capitalize">
                    {child.type}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card className="p-6">
        <h3 className="mb-4 text-lg font-semibold text-foreground">Active Routes</h3>
        <div className="space-y-2">
          {[
            { from: "realm_compute_001", to: "realm_gw_001", messages: 1247 },
            { from: "realm_gw_001", to: "realm_root_001", messages: 892 },
            { from: "realm_bridge_001", to: "realm_root_001", messages: 156 },
          ].map((route, i) => (
            <div key={i} className="flex items-center justify-between rounded-md bg-muted/50 p-3 text-sm">
              <div className="flex items-center gap-2">
                <span className="font-mono text-muted-foreground">{route.from}</span>
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                <span className="font-mono text-muted-foreground">{route.to}</span>
              </div>
              <Badge variant="outline">{route.messages} msgs</Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
