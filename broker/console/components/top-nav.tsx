"use client"

import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { MeshInfo, GitBranch } from "@/lib/types"
import { Network, GitBranchIcon, AlertCircle, AlertTriangle } from "lucide-react"
import { ThemeSwitcher } from "@/components/theme-switcher"

interface TopNavProps {
  meshInfo: MeshInfo
  currentBranch: GitBranch
  branches: GitBranch[]
  onBranchChange: (branchName: string) => void
  problemCount?: number
  warningCount?: number
}

export function TopNav({
  meshInfo,
  currentBranch,
  branches,
  onBranchChange,
  problemCount = 0,
  warningCount = 0,
}: TopNavProps) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-card px-6">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Network className="h-5 w-5 text-primary" />
          <span className="text-lg font-semibold text-foreground">RealmMesh Console</span>
        </div>
        <div className="h-4 w-px bg-border" />
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Mesh:</span>
            <span className="font-mono text-sm text-foreground">{meshInfo.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">UUID:</span>
            <span className="font-mono text-xs text-muted-foreground">{meshInfo.uuid}</span>
          </div>
          <Badge variant="secondary">{meshInfo.environment}</Badge>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {(problemCount > 0 || warningCount > 0) && (
          <>
            {problemCount > 0 && (
              <Badge variant="outline" className="gap-1 bg-red-500/10 text-red-500">
                <AlertCircle className="h-3 w-3" />
                {problemCount}
              </Badge>
            )}
            {warningCount > 0 && (
              <Badge variant="outline" className="gap-1 bg-yellow-500/10 text-yellow-500">
                <AlertTriangle className="h-3 w-3" />
                {warningCount}
              </Badge>
            )}
            <div className="h-4 w-px bg-border" />
          </>
        )}

        <div className="flex items-center gap-2">
          <GitBranchIcon className="h-4 w-4 text-muted-foreground" />
          <Select value={currentBranch.name} onValueChange={onBranchChange}>
            <SelectTrigger className="h-8 w-[180px] border-border bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {branches.map((branch) => (
                <SelectItem key={branch.name} value={branch.name}>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm">{branch.name}</span>
                    {branch.isDefault && (
                      <Badge variant="outline" className="h-4 px-1 text-[10px]">
                        default
                      </Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="h-4 w-px bg-border" />
        <ThemeSwitcher />
      </div>
    </header>
  )
}
