import { Network, Globe, Cpu, GitBranch, Layers } from "lucide-react"
import { cn } from "@/lib/utils"

interface RealmTypeIconProps {
  type: "root" | "gateway" | "compute" | "bridge" | "sub-gateway"
  className?: string
}

export function RealmTypeIcon({ type, className }: RealmTypeIconProps) {
  const icons = {
    root: Network,
    gateway: Globe,
    compute: Cpu,
    bridge: GitBranch,
    "sub-gateway": Layers,
  }

  const Icon = icons[type]

  return <Icon className={cn("text-primary", className)} />
}
