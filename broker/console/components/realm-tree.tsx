"use client"

import { useState } from "react"
import { ChevronRight, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { RealmStatusBadge } from "./realm-status-badge"
import { RealmTypeIcon } from "./realm-type-icon"
import type { Realm, PendingChange, RealmStatus } from "@/lib/types"

interface RealmTreeProps {
  realms: Realm[]
  selectedRealmId: string | null
  onSelectRealm: (id: string) => void
  pendingChanges: PendingChange[]
}

const getStatusColor = (status: RealmStatus): string => {
  switch (status) {
    case "active":
      return "text-success"
    case "degraded":
      return "text-warning"
    case "inactive":
      return "text-muted-foreground"
    case "error":
      return "text-error"
    default:
      return "text-muted-foreground"
  }
}

const getStatusDotColor = (status: RealmStatus): string => {
  switch (status) {
    case "active":
      return "bg-success"
    case "degraded":
      return "bg-warning"
    case "inactive":
      return "bg-muted-foreground"
    case "error":
      return "bg-error"
    default:
      return "bg-muted-foreground"
  }
}

export function RealmTree({ realms, selectedRealmId, onSelectRealm, pendingChanges }: RealmTreeProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(["realm_root_001", "realm_gw_001"]))

  const toggleNode = (id: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const hasPendingChange = (realmId: string) => {
    return pendingChanges.some((c) => c.realmId === realmId)
  }

  const renderRealm = (realm: Realm, depth = 0) => {
    const hasChildren = realm.children.length > 0
    const isExpanded = expandedNodes.has(realm.id)
    const isSelected = selectedRealmId === realm.id
    const isPending = hasPendingChange(realm.id)

    return (
      <div key={realm.id}>
        <button
          onClick={() => onSelectRealm(realm.id)}
          className={cn(
            "group flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm transition-all",
            isSelected
              ? "bg-primary/15 text-foreground shadow-sm ring-1 ring-primary/20"
              : "text-foreground hover:bg-accent/50",
          )}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
        >
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation()
                toggleNode(realm.id)
              }}
              className="flex h-4 w-4 items-center justify-center text-muted-foreground hover:text-foreground"
            >
              {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            </button>
          ) : (
            <div className="w-4" />
          )}
          <div className={cn("h-2 w-2 shrink-0 rounded-full", getStatusDotColor(realm.status))} />
          <RealmTypeIcon type={realm.type} className={cn("h-4 w-4 shrink-0", getStatusColor(realm.status))} />
          <span className="flex-1 truncate font-medium">{realm.name}</span>
          {isPending && (
            <div className="flex items-center gap-1">
              <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-warning" />
            </div>
          )}
          <RealmStatusBadge status={realm.status} size="sm" />
        </button>

        {hasChildren && isExpanded && (
          <div className="mt-0.5">
            {realm.children.map((childId) => {
              const childRealm = realms.find((r) => r.id === childId)
              return childRealm ? renderRealm(childRealm, depth + 1) : null
            })}
          </div>
        )}
      </div>
    )
  }

  const rootRealm = realms.find((r) => r.type === "root")
  return <div className="space-y-1">{rootRealm && renderRealm(rootRealm)}</div>
}
