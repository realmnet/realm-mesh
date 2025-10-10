"use client"

import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AlertCircle, AlertTriangle, Info, ChevronRight } from "lucide-react"
import type { ValidationIssue } from "@/lib/types"
import { cn } from "@/lib/utils"

interface ProblemsPanelProps {
  issues: ValidationIssue[]
  onNavigateToIssue: (nodeId: string) => void
}

export function ProblemsPanel({ issues, onNavigateToIssue }: ProblemsPanelProps) {
  const errors = issues.filter((i) => i.severity === "error")
  const warnings = issues.filter((i) => i.severity === "warning")
  const infos = issues.filter((i) => i.severity === "info")

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case "info":
        return <Info className="h-4 w-4 text-blue-500" />
      default:
        return null
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "error":
        return "text-red-500"
      case "warning":
        return "text-yellow-500"
      case "info":
        return "text-blue-500"
      default:
        return "text-muted-foreground"
    }
  }

  const getCategoryBadge = (category: string) => {
    const variants: Record<string, string> = {
      contract: "bg-purple-500/10 text-purple-500",
      dependency: "bg-orange-500/10 text-orange-500",
      configuration: "bg-blue-500/10 text-blue-500",
      status: "bg-cyan-500/10 text-cyan-500",
    }
    return variants[category] || "bg-muted text-muted-foreground"
  }

  return (
    <div className="flex h-full flex-col border-t border-border bg-card/50">
      <div className="flex items-center justify-between border-b border-border bg-card/80 px-4 py-2 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-foreground">Problems</h3>
          <div className="flex items-center gap-2">
            {errors.length > 0 && (
              <Badge variant="outline" className="h-5 gap-1 bg-red-500/10 text-red-500">
                <AlertCircle className="h-3 w-3" />
                {errors.length}
              </Badge>
            )}
            {warnings.length > 0 && (
              <Badge variant="outline" className="h-5 gap-1 bg-yellow-500/10 text-yellow-500">
                <AlertTriangle className="h-3 w-3" />
                {warnings.length}
              </Badge>
            )}
            {infos.length > 0 && (
              <Badge variant="outline" className="h-5 gap-1 bg-blue-500/10 text-blue-500">
                <Info className="h-3 w-3" />
                {infos.length}
              </Badge>
            )}
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2">
          {issues.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="mb-2 rounded-full bg-green-500/10 p-3">
                <AlertCircle className="h-6 w-6 text-green-500" />
              </div>
              <p className="text-sm font-medium text-foreground">No problems detected</p>
              <p className="text-xs text-muted-foreground">All contracts and dependencies are resolved</p>
            </div>
          ) : (
            <div className="space-y-1">
              {issues.map((issue) => (
                <button
                  key={issue.id}
                  onClick={() => onNavigateToIssue(issue.nodeId)}
                  className="group flex w-full items-start gap-3 rounded-md border border-transparent px-3 py-2 text-left transition-colors hover:border-border hover:bg-accent/50"
                >
                  <div className="mt-0.5">{getSeverityIcon(issue.severity)}</div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={cn("text-sm font-medium", getSeverityColor(issue.severity))}>
                        {issue.message}
                      </span>
                      <Badge variant="outline" className={cn("h-4 px-1 text-[10px]", getCategoryBadge(issue.category))}>
                        {issue.category}
                      </Badge>
                    </div>
                    <p className="font-mono text-xs text-muted-foreground">{issue.path}</p>
                  </div>
                  <ChevronRight className="mt-1 h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </button>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
