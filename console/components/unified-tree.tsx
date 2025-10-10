"use client"

import { useState } from "react"
import { ChevronRight, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { RealmTypeIcon } from "./realm-type-icon"
import type { TreeNode, RealmStatus, BridgeStatus, PendingChange } from "@/lib/types"
import { Database, FileText, Package, Bot, GitBranch, Folder, Network } from "lucide-react"

interface UnifiedTreeProps {
  nodes: TreeNode[]
  selectedNodeId: string | null
  onSelectNode: (nodeId: string) => void
  pendingChanges: PendingChange[]
}

export function UnifiedTree({ nodes, selectedNodeId, onSelectNode, pendingChanges }: UnifiedTreeProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(["realm_root_001"]))

  const toggleExpand = (nodeId: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev)
      if (next.has(nodeId)) {
        next.delete(nodeId)
      } else {
        next.add(nodeId)
      }
      return next
    })
  }

  const getStatusColor = (status?: RealmStatus | BridgeStatus) => {
    switch (status) {
      case "active":
      case "connected":
        return "text-green-500"
      case "degraded":
        return "text-yellow-500"
      case "error":
      case "disconnected":
        return "text-red-500"
      case "inactive":
        return "text-gray-500"
      case "configuring":
      case "deploying":
        return "text-blue-500"
      case "pending":
        return "text-cyan-500"
      default:
        return "text-muted-foreground"
    }
  }

  const getStatusDotColor = (status?: RealmStatus | BridgeStatus) => {
    switch (status) {
      case "active":
      case "connected":
        return "bg-green-500"
      case "degraded":
        return "bg-yellow-500"
      case "error":
      case "disconnected":
        return "bg-red-500"
      case "inactive":
        return "bg-gray-500"
      case "configuring":
      case "deploying":
        return "bg-blue-500 animate-pulse"
      case "pending":
        return "bg-cyan-500 animate-pulse"
      default:
        return "bg-gray-500"
    }
  }

  const getFolderStyle = (folderName: string) => {
    const name = folderName.toLowerCase().replace("/", "")

    switch (name) {
      case "capabilities":
        return {
          iconColor: "text-blue-500",
        }
      case "contracts":
        return {
          iconColor: "text-purple-500",
        }
      case "pods":
        return {
          iconColor: "text-green-500",
        }
      case "agents":
        return {
          iconColor: "text-orange-500",
        }
      case "bridges":
        return {
          iconColor: "text-cyan-500",
        }
      case "gateways":
        return {
          iconColor: "text-pink-500",
        }
      default:
        return {
          iconColor: "text-muted-foreground",
        }
    }
  }

  const getNodeIcon = (node: TreeNode) => {
    // For folders, use folder-specific styling
    if (node.type === "folder") {
      const folderStyle = getFolderStyle(node.name)
      return <Folder className={cn("h-4 w-4", folderStyle.iconColor)} />
    }

    // For resources, use type-based colors (not status-based)
    let iconColor = "text-muted-foreground"

    switch (node.type) {
      case "capability":
        iconColor = "text-blue-500"
        break
      case "contract":
        iconColor = "text-purple-500"
        break
      case "pod":
        iconColor = "text-green-500"
        break
      case "agent":
        iconColor = "text-orange-500"
        break
      case "bridge":
        iconColor = "text-cyan-500"
        break
      case "gateway":
        iconColor = "text-pink-500"
        break
      case "realm":
        // Realms use status-based coloring
        iconColor = node.status ? getStatusColor(node.status) : "text-muted-foreground"
        break
    }

    const iconClass = cn("h-4 w-4", iconColor)

    switch (node.type) {
      case "realm":
        return <RealmTypeIcon type="root" className={iconClass} />
      case "gateway":
        return <Network className={iconClass} />
      case "capability":
        return <Database className={iconClass} />
      case "contract":
        return <FileText className={iconClass} />
      case "pod":
        return <Package className={iconClass} />
      case "agent":
        return <Bot className={iconClass} />
      case "bridge":
        return <GitBranch className={iconClass} />
      default:
        return null
    }
  }

  const hasPendingChanges = (nodeId: string) => {
    return pendingChanges.some((change) => change.realmId === nodeId)
  }

  const renderNode = (node: TreeNode, depth = 0) => {
    const isExpanded = expandedNodes.has(node.id)
    const hasChildren = node.children.length > 0
    const isSelected = selectedNodeId === node.id
    const isPending = hasPendingChanges(node.id)

    return (
      <div key={node.id}>
        <button
          onClick={() => onSelectNode(node.id)}
          className={cn(
            "flex w-full items-center gap-2 px-2 py-1.5 text-sm transition-colors",
            isSelected ? "bg-primary/10 text-primary" : "text-foreground hover:bg-accent/50",
          )}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
        >
          {hasChildren && (
            <div
              onClick={(e) => {
                e.stopPropagation()
                toggleExpand(node.id)
              }}
              className="flex h-4 w-4 cursor-pointer items-center justify-center"
            >
              {isExpanded ? (
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-3 w-3 text-muted-foreground" />
              )}
            </div>
          )}
          {!hasChildren && <div className="w-4" />}

          {node.status && <div className={cn("h-2 w-2 rounded-full", getStatusDotColor(node.status))} />}

          <div className={cn(isSelected && !node.status && "text-primary")}>{getNodeIcon(node)}</div>

          <span className="flex-1 truncate text-left font-mono">{node.name}</span>

          {isPending && (
            <span className="rounded-full bg-warning/20 px-1.5 py-0.5 text-[10px] font-medium text-warning">•</span>
          )}

          {hasChildren && <span className="text-xs text-muted-foreground">{node.children.length}</span>}
        </button>

        {isExpanded &&
          hasChildren &&
          node.children.map((childId) => {
            const childNode = nodes.find((n) => n.id === childId)
            return childNode ? renderNode(childNode, depth + 1) : null
          })}
      </div>
    )
  }

  const rootNodes = nodes.filter((node) => node.parent === null)

  return <div className="space-y-1">{rootNodes.map((node) => renderNode(node))}</div>
}
