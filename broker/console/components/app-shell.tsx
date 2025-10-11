"use client"

import { useState, useEffect } from "react"
import { LayoutDashboard, Network, Settings } from "lucide-react"
import { cn } from "@/lib/utils"
import { RealmTreeTopology } from "./realm-tree-topology"
import { RealmsMonitor } from "./realms-monitor"
import { AdminPage } from "./admin-page"
import { WebSocketProvider } from "@/lib/websocket-context"

type NavSection = "dashboard" | "topology" | "admin"

export function AppShell() {
  const [activeSection, setActiveSection] = useState<NavSection>("topology")

  const shellId = useState(() => Math.random().toString(36).substr(2, 9))[0]

  console.log(`🏠 [AppShell-${shellId}] Component rendered, activeSection: ${activeSection}`)

  useEffect(() => {
    console.log(`🏠 [AppShell-${shellId}] Component mounted`)
    return () => {
      console.log(`🏠 [AppShell-${shellId}] Component unmounting`)
    }
  }, [shellId])

  useEffect(() => {
    console.log(`🏠 [AppShell-${shellId}] Active section changed to: ${activeSection}`)
  }, [activeSection, shellId])

  return (
    <WebSocketProvider>
      <div className="flex h-screen bg-background">
        {/* Left Icon Navigation */}
        <div className="flex w-16 flex-col items-center gap-2 border-r border-border bg-card/80 py-4 backdrop-blur-sm">
          <button
            onClick={() => setActiveSection("dashboard")}
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-lg transition-colors",
              activeSection === "dashboard"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            )}
            title="Dashboard"
          >
            <LayoutDashboard className="h-5 w-5" />
          </button>
          <button
            onClick={() => setActiveSection("topology")}
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-lg transition-colors",
              activeSection === "topology"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            )}
            title="Topology"
          >
            <Network className="h-5 w-5" />
          </button>
          <button
            onClick={() => setActiveSection("admin")}
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-lg transition-colors",
              activeSection === "admin"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            )}
            title="Admin"
          >
            <Settings className="h-5 w-5" />
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {activeSection === "dashboard" && <RealmsMonitor />}
          {activeSection === "topology" && <RealmTreeTopology />}
          {activeSection === "admin" && <AdminPage />}
        </div>
      </div>
    </WebSocketProvider>
  )
}
