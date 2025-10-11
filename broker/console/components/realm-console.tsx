"use client"

import { useState } from "react"
import { RealmTree } from "./realm-tree"
import { RealmDetails } from "./realm-details"
import { TopNav } from "./top-nav"
import { CreateRealmModal } from "./create-realm-modal"
import { Button } from "@/components/ui/button"
import { Plus, Upload } from "lucide-react"
import type { Realm, MeshInfo, PendingChange } from "@/lib/types"

// Mock data
const mockMeshInfo: MeshInfo = {
  name: "production-mesh",
  uuid: "mesh_7f3a9b2c1d4e",
  environment: "production",
}

const mockRealms: Realm[] = [
  {
    id: "realm_root_001",
    name: "root",
    type: "root",
    status: "active",
    replicas: 3,
    parent: null,
    image: "interrealm/root:v1.2.0",
    providedCapabilities: ["mesh.control", "policy.enforce", "routing.global"],
    requiredCapabilities: [],
    children: ["realm_gw_001", "realm_bridge_001"],
  },
  {
    id: "realm_gw_001",
    name: "gateway-alpha",
    type: "gateway",
    status: "active",
    replicas: 2,
    parent: "realm_root_001",
    image: "interrealm/gateway:v1.1.5",
    providedCapabilities: ["routing.local", "policy.filter"],
    requiredCapabilities: ["mesh.control"],
    children: ["realm_compute_001", "realm_compute_002", "realm_subgw_001"],
  },
  {
    id: "realm_compute_001",
    name: "compute-ai-inference",
    type: "compute",
    status: "active",
    replicas: 5,
    parent: "realm_gw_001",
    image: "interrealm/compute:v2.0.1",
    providedCapabilities: ["ai.inference", "model.llm"],
    requiredCapabilities: ["routing.local"],
    children: [],
  },
  {
    id: "realm_compute_002",
    name: "compute-data-processing",
    type: "compute",
    status: "degraded",
    replicas: 3,
    parent: "realm_gw_001",
    image: "interrealm/compute:v2.0.1",
    providedCapabilities: ["data.transform", "stream.process"],
    requiredCapabilities: ["routing.local"],
    children: [],
  },
  {
    id: "realm_subgw_001",
    name: "subgateway-beta",
    type: "sub-gateway",
    status: "active",
    replicas: 1,
    parent: "realm_gw_001",
    image: "interrealm/gateway:v1.1.5",
    providedCapabilities: ["routing.scoped"],
    requiredCapabilities: ["routing.local"],
    children: ["realm_compute_003"],
  },
  {
    id: "realm_compute_003",
    name: "compute-analytics",
    type: "compute",
    status: "active",
    replicas: 2,
    parent: "realm_subgw_001",
    image: "interrealm/compute:v2.0.1",
    providedCapabilities: ["analytics.realtime"],
    requiredCapabilities: ["routing.scoped"],
    children: [],
  },
  {
    id: "realm_bridge_001",
    name: "bridge-external-mesh",
    type: "bridge",
    status: "active",
    replicas: 2,
    parent: "realm_root_001",
    image: "interrealm/bridge:v1.0.3",
    providedCapabilities: ["mesh.federation"],
    requiredCapabilities: ["mesh.control"],
    children: [],
  },
]

export function RealmConsole() {
  const [selectedRealmId, setSelectedRealmId] = useState<string | null>("realm_root_001")
  const [realms, setRealms] = useState<Realm[]>(mockRealms)
  const [pendingChanges, setPendingChanges] = useState<PendingChange[]>([])
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  const selectedRealm = realms.find((r) => r.id === selectedRealmId)

  const handleRealmUpdate = (updatedRealm: Realm) => {
    // Add to pending changes instead of immediate update
    setPendingChanges((prev) => [
      ...prev.filter((c) => c.realmId !== updatedRealm.id),
      {
        id: `change_${Date.now()}`,
        realmId: updatedRealm.id,
        type: "update",
        data: updatedRealm,
        timestamp: new Date(),
      },
    ])
  }

  const handleDeploy = () => {
    // Apply all pending changes
    const updatedRealms = [...realms]
    pendingChanges.forEach((change) => {
      const index = updatedRealms.findIndex((r) => r.id === change.realmId)
      if (index !== -1 && change.type === "update") {
        updatedRealms[index] = change.data as Realm
      } else if (change.type === "create") {
        updatedRealms.push(change.data as Realm)
      }
    })
    setRealms(updatedRealms)
    setPendingChanges([])
  }

  const handleCreateRealm = (newRealm: Realm) => {
    setPendingChanges((prev) => [
      ...prev,
      {
        id: `change_${Date.now()}`,
        realmId: newRealm.id,
        type: "create",
        data: newRealm,
        timestamp: new Date(),
      },
    ])
    setIsCreateModalOpen(false)
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      <TopNav meshInfo={mockMeshInfo} />

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Realm Tree */}
        <div className="flex w-80 flex-col border-r border-border bg-card/50 backdrop-blur-sm">
          <div className="flex items-center justify-between border-b border-border bg-card/80 px-4 py-3 backdrop-blur-sm">
            <h2 className="font-semibold text-foreground">Realms</h2>
            <Button size="sm" variant="ghost" onClick={() => setIsCreateModalOpen(true)} className="h-8 w-8 p-0">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            <RealmTree
              realms={realms}
              selectedRealmId={selectedRealmId}
              onSelectRealm={setSelectedRealmId}
              pendingChanges={pendingChanges}
            />
          </div>
          {pendingChanges.length > 0 && (
            <div className="border-t border-border bg-card/80 p-4 backdrop-blur-sm">
              <div className="mb-3 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {pendingChanges.length} pending change
                  {pendingChanges.length !== 1 ? "s" : ""}
                </span>
                <span className="rounded-full bg-warning/20 px-2 py-0.5 text-xs font-medium text-warning">Unsaved</span>
              </div>
              <Button className="w-full" size="sm" onClick={handleDeploy}>
                <Upload className="mr-2 h-4 w-4" />
                Deploy Changes
              </Button>
            </div>
          )}
        </div>

        {/* Main Content - Realm Details */}
        <div className="flex-1 overflow-hidden bg-background">
          {selectedRealm ? (
            <RealmDetails realm={selectedRealm} allRealms={realms} onUpdate={handleRealmUpdate} />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              Select a realm to view details
            </div>
          )}
        </div>
      </div>

      <CreateRealmModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onCreateRealm={handleCreateRealm}
        existingRealms={realms}
      />
    </div>
  )
}
