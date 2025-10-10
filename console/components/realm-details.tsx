"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { OverviewTab } from "./tabs/overview-tab"
import { ContractsTab } from "./tabs/contracts-tab"
import { ConnectionsTab } from "./tabs/connections-tab"
import { LogsTab } from "./tabs/logs-tab"
import type { Realm } from "@/lib/types"

interface RealmDetailsProps {
  realm: Realm
  allRealms: Realm[]
  onUpdate: (realm: Realm) => void
}

export function RealmDetails({ realm, allRealms, onUpdate }: RealmDetailsProps) {
  const [activeTab, setActiveTab] = useState("overview")

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border bg-card px-6 py-4">
        <h1 className="text-2xl font-semibold text-foreground">{realm.name}</h1>
        <p className="mt-1 font-mono text-sm text-muted-foreground">{realm.id}</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-1 flex-col overflow-hidden">
        <TabsList className="mx-6 mt-4 w-fit">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="contracts">Contracts</TabsTrigger>
          <TabsTrigger value="connections">Connections</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <TabsContent value="overview" className="mt-0">
            <OverviewTab realm={realm} allRealms={allRealms} onUpdate={onUpdate} />
          </TabsContent>
          <TabsContent value="contracts" className="mt-0">
            <ContractsTab realm={realm} />
          </TabsContent>
          <TabsContent value="connections" className="mt-0">
            <ConnectionsTab realm={realm} allRealms={allRealms} />
          </TabsContent>
          <TabsContent value="logs" className="mt-0">
            <LogsTab realm={realm} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
