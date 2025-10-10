import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface RealmStatusBadgeProps {
  status: "active" | "degraded" | "inactive" | "error"
  size?: "sm" | "default"
}

export function RealmStatusBadge({ status, size = "default" }: RealmStatusBadgeProps) {
  const colors = {
    active: "bg-success/10 text-success border-success/20",
    degraded: "bg-warning/10 text-warning border-warning/20",
    inactive: "bg-muted-foreground/10 text-muted-foreground border-muted-foreground/20",
    error: "bg-destructive/10 text-destructive border-destructive/20",
  }

  return (
    <Badge variant="outline" className={cn("capitalize", colors[status], size === "sm" && "h-5 px-1.5 text-xs")}>
      <div
        className={cn(
          "mr-1.5 rounded-full",
          size === "sm" ? "h-1.5 w-1.5" : "h-2 w-2",
          status === "active" && "bg-success",
          status === "degraded" && "bg-warning",
          status === "inactive" && "bg-muted-foreground",
          status === "error" && "bg-destructive",
        )}
      />
      {status}
    </Badge>
  )
}
