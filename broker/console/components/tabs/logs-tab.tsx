import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Realm } from "@/lib/types"

interface LogsTabProps {
  realm: Realm
}

export function LogsTab({ realm }: LogsTabProps) {
  const logs = [
    {
      timestamp: "2025-01-08T14:32:15Z",
      level: "info",
      message: "Realm health check passed",
    },
    {
      timestamp: "2025-01-08T14:31:42Z",
      level: "info",
      message: "Contract fulfilled: routing.local",
    },
    {
      timestamp: "2025-01-08T14:30:18Z",
      level: "warn",
      message: "High message queue depth detected",
    },
    {
      timestamp: "2025-01-08T14:29:55Z",
      level: "info",
      message: "Replica scaled: 3 -> 5",
    },
    {
      timestamp: "2025-01-08T14:28:33Z",
      level: "error",
      message: "Connection timeout to realm_compute_002",
    },
    {
      timestamp: "2025-01-08T14:27:10Z",
      level: "info",
      message: "Policy update applied",
    },
  ]

  const getLevelColor = (level: string) => {
    switch (level) {
      case "error":
        return "destructive"
      case "warn":
        return "secondary"
      case "info":
      default:
        return "outline"
    }
  }

  return (
    <Card className="p-6">
      <h3 className="mb-4 text-lg font-semibold text-foreground">Recent Logs</h3>
      <div className="space-y-2">
        {logs.map((log, i) => (
          <div
            key={i}
            className="flex items-start gap-3 rounded-md border border-border bg-muted/50 p-3 font-mono text-sm"
          >
            <span className="text-xs text-muted-foreground">{new Date(log.timestamp).toLocaleTimeString()}</span>
            <Badge variant={getLevelColor(log.level)} className="uppercase">
              {log.level}
            </Badge>
            <span className="flex-1 text-foreground">{log.message}</span>
          </div>
        ))}
      </div>
    </Card>
  )
}
