"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Folder, Database, FileText, Package, Bot, GitBranch } from "lucide-react"
import type { TreeNode } from "@/lib/types"
import { cn } from "@/lib/utils"

interface FolderDetailsProps {
  folder: TreeNode
  allNodes: TreeNode[]
  onCreateResource: (folderType: string) => void
}

export function FolderDetails({ folder, allNodes, onCreateResource }: FolderDetailsProps) {
  const childNodes = allNodes.filter((node) => folder.children.includes(node.id))

  const getFolderIcon = (folderType?: string) => {
    switch (folderType) {
      case "capabilities":
        return <Database className="h-5 w-5 text-cyan-500" />
      case "contracts":
        return <FileText className="h-5 w-5 text-blue-500" />
      case "pods":
        return <Package className="h-5 w-5 text-purple-500" />
      case "agents":
        return <Bot className="h-5 w-5 text-green-500" />
      case "bridges":
        return <GitBranch className="h-5 w-5 text-orange-500" />
      case "gateways":
        return <Folder className="h-5 w-5 text-yellow-500" />
      default:
        return <Folder className="h-5 w-5 text-muted-foreground" />
    }
  }

  const getResourceTypeName = (folderType?: string) => {
    switch (folderType) {
      case "capabilities":
        return "Capability"
      case "contracts":
        return "Contract"
      case "pods":
        return "Pod"
      case "agents":
        return "Agent"
      case "bridges":
        return "Bridge"
      case "gateways":
        return "Gateway"
      default:
        return "Resource"
    }
  }

  const getStatusBadge = (status?: string) => {
    if (!status) return null

    const statusColors: Record<string, string> = {
      active: "bg-green-500/10 text-green-500 border-green-500/20",
      connected: "bg-green-500/10 text-green-500 border-green-500/20",
      degraded: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
      error: "bg-red-500/10 text-red-500 border-red-500/20",
      disconnected: "bg-red-500/10 text-red-500 border-red-500/20",
      inactive: "bg-gray-500/10 text-gray-500 border-gray-500/20",
      deploying: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      pending: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
    }

    return (
      <Badge variant="outline" className={cn("text-xs", statusColors[status] || "")}>
        {status}
      </Badge>
    )
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-border bg-card/50 px-6 py-4 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getFolderIcon(folder.folderType)}
            <div>
              <h2 className="text-lg font-semibold text-foreground">{folder.name}</h2>
              <p className="text-sm text-muted-foreground">
                {childNodes.length} {getResourceTypeName(folder.folderType)}
                {childNodes.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <Button onClick={() => onCreateResource(folder.folderType || "")}>
            <Plus className="mr-2 h-4 w-4" />
            Create {getResourceTypeName(folder.folderType)}
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {childNodes.length === 0 ? (
          <Card className="border-dashed bg-card/50 p-8 text-center">
            <Folder className="mx-auto mb-3 h-12 w-12 text-muted-foreground/50" />
            <p className="mb-2 text-sm font-medium text-foreground">No {folder.name} yet</p>
            <p className="mb-4 text-xs text-muted-foreground">
              Create your first {getResourceTypeName(folder.folderType)?.toLowerCase()} to get started
            </p>
            <Button variant="outline" onClick={() => onCreateResource(folder.folderType || "")}>
              <Plus className="mr-2 h-4 w-4" />
              Create {getResourceTypeName(folder.folderType)}
            </Button>
          </Card>
        ) : (
          <div className="space-y-3">
            {childNodes.map((node) => (
              <Card key={node.id} className="bg-card/50 p-4 transition-colors hover:bg-card/80">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <h3 className="font-mono text-sm font-medium text-foreground">{node.name}</h3>
                      {getStatusBadge(node.status)}
                    </div>
                    {node.data?.description && <p className="text-xs text-muted-foreground">{node.data.description}</p>}
                    {node.data?.version && (
                      <p className="mt-1 font-mono text-xs text-muted-foreground">v{node.data.version}</p>
                    )}
                    {node.data?.image && (
                      <p className="mt-1 font-mono text-xs text-muted-foreground">{node.data.image}</p>
                    )}
                    {node.data?.replicas && (
                      <p className="mt-1 text-xs text-muted-foreground">{node.data.replicas} replicas</p>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
