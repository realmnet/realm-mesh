"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Activity, Network, Radio, Repeat, CheckCircle, XCircle, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { useWebSocket } from "@/lib/websocket-context"

export function ActivityFeed() {
  const { loops, serviceCalls, events } = useWebSocket()

  // Combine all activities into a single timeline
  const activities = [
    ...loops.map(loop => ({
      id: loop.id,
      type: 'loop' as const,
      timestamp: loop.startTime,
      data: loop
    })),
    ...serviceCalls.map(call => ({
      id: call.id,
      type: 'service' as const,
      timestamp: call.timestamp,
      data: call
    })),
    ...events.map(event => ({
      id: event.id,
      type: 'event' as const,
      timestamp: event.timestamp,
      data: event
    }))
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'loop':
        return <Repeat className="h-4 w-4" />
      case 'service':
        return <Network className="h-4 w-4" />
      case 'event':
        return <Radio className="h-4 w-4" />
      default:
        return <Activity className="h-4 w-4" />
    }
  }

  const getStatusColor = (activity: any) => {
    if (activity.type === 'loop') {
      switch (activity.data.status) {
        case 'recruiting':
          return 'text-blue-500 bg-blue-500/10'
        case 'executing':
          return 'text-yellow-500 bg-yellow-500/10'
        case 'completed':
          return 'text-green-500 bg-green-500/10'
        case 'failed':
          return 'text-red-500 bg-red-500/10'
        default:
          return 'text-muted-foreground bg-muted'
      }
    } else if (activity.type === 'service') {
      switch (activity.data.status) {
        case 'pending':
          return 'text-yellow-500 bg-yellow-500/10'
        case 'completed':
          return 'text-green-500 bg-green-500/10'
        case 'failed':
          return 'text-red-500 bg-red-500/10'
        default:
          return 'text-muted-foreground bg-muted'
      }
    } else if (activity.type === 'event') {
      return activity.data.type === 'published'
        ? 'text-purple-500 bg-purple-500/10'
        : 'text-cyan-500 bg-cyan-500/10'
    }
    return 'text-muted-foreground bg-muted'
  }

  const getActivityDescription = (activity: any) => {
    if (activity.type === 'loop') {
      const loop = activity.data
      return (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">{loop.name}</span>
            <Badge className={cn("text-xs", getStatusColor(activity))}>
              {loop.status}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Initiator: {loop.initiator} • {loop.participants.length} participants
          </p>
        </div>
      )
    } else if (activity.type === 'service') {
      const call = activity.data
      return (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">{call.service}</span>
            <Badge className={cn("text-xs", getStatusColor(activity))}>
              {call.status}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            {call.caller} → {call.target} • {call.capability}
          </p>
        </div>
      )
    } else if (activity.type === 'event') {
      const event = activity.data
      return (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">{event.topic}</span>
            <Badge className={cn("text-xs", getStatusColor(activity))}>
              {event.type}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            {event.type === 'published'
              ? `Published by ${event.publisher || 'unknown'} • ${event.subscriberCount || 0} subscribers`
              : `Subscribed by ${event.subscriber || 'unknown'}`}
          </p>
        </div>
      )
    }
  }

  const getStatusIcon = (activity: any) => {
    if (activity.type === 'loop') {
      switch (activity.data.status) {
        case 'completed':
          return <CheckCircle className="h-3 w-3 text-green-500" />
        case 'failed':
          return <XCircle className="h-3 w-3 text-red-500" />
        case 'executing':
          return <Clock className="h-3 w-3 text-yellow-500 animate-pulse" />
        default:
          return <Clock className="h-3 w-3 text-blue-500" />
      }
    } else if (activity.type === 'service') {
      switch (activity.data.status) {
        case 'completed':
          return <CheckCircle className="h-3 w-3 text-green-500" />
        case 'failed':
          return <XCircle className="h-3 w-3 text-red-500" />
        default:
          return <Clock className="h-3 w-3 text-yellow-500 animate-pulse" />
      }
    }
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Real-Time Activity Feed
        </CardTitle>
        <CardDescription>
          Live stream of all agent interactions
        </CardDescription>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Activity className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-sm text-muted-foreground mb-1">No recent activity</p>
            <p className="text-xs text-muted-foreground">
              Start the demo to see real-time interactions
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 rounded-lg border border-border bg-card/50 p-3 transition-all hover:bg-accent/50"
                >
                  <div className={cn(
                    "mt-1 flex h-8 w-8 items-center justify-center rounded-full",
                    getStatusColor(activity)
                  )}>
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 space-y-1">
                    {getActivityDescription(activity)}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {getStatusIcon(activity)}
                    <span className="text-xs text-muted-foreground">
                      {new Date(activity.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}
