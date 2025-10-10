"use client"

import { useState, useEffect } from "react"
import { UnifiedTree } from "./unified-tree"
import { RealmDetails } from "./realm-details"
import { TopNav } from "./top-nav"
import { CreateRealmModal } from "./create-realm-modal"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import type { Realm, MeshInfo, PendingChange, GitBranch, TreeNode, ValidationIssue } from "@/lib/types"
import { FolderDetails } from "./folder-details"
import { BottomPanel } from "./bottom-panel"
import { validateTree } from "@/lib/validation"
import { PodDetails } from "./pod-details"

// Mock data
const mockMeshInfo: MeshInfo = {
  name: "production-mesh",
  uuid: "mesh_7f3a9b2c1d4e",
  environment: "production",
}

const mockBranches: GitBranch[] = [
  {
    name: "main",
    isDefault: true,
    lastCommit: {
      sha: "a3f2c1d",
      message: "Update finance gateway capabilities",
      author: "ops-team",
      timestamp: new Date("2025-01-08T10:30:00"),
    },
  },
  {
    name: "feature/payment-v2",
    isDefault: false,
    lastCommit: {
      sha: "b7e4f2a",
      message: "Add payment processing v2 capability",
      author: "dev-team",
      timestamp: new Date("2025-01-09T14:20:00"),
    },
  },
]

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
    children: ["realm_gw_finance", "realm_gw_marketing"],
    routeTable: [
      {
        capabilityRef: "finance.payment-processing",
        targetGatewayId: "realm_gw_finance",
        allowedSourceGateways: ["realm_gw_marketing"],
        priority: 1,
      },
    ],
  },
  {
    id: "realm_gw_finance",
    name: "finance-gateway",
    type: "gateway",
    status: "active",
    replicas: 2,
    parent: "realm_root_001",
    image: "interrealm/gateway:v1.1.5",
    providedCapabilities: ["routing.local", "policy.filter"],
    requiredCapabilities: ["mesh.control"],
    children: [],
  },
  {
    id: "realm_gw_payments",
    name: "payments-gateway",
    type: "gateway",
    status: "active",
    replicas: 2,
    parent: "realm_gw_finance",
    image: "interrealm/gateway:v1.1.5",
    providedCapabilities: ["routing.local"],
    requiredCapabilities: ["mesh.control"],
    children: [],
  },
  {
    id: "realm_gw_ach",
    name: "ach-gateway",
    type: "gateway",
    status: "active",
    replicas: 1,
    parent: "realm_gw_payments",
    image: "interrealm/gateway:v1.1.5",
    providedCapabilities: ["routing.local"],
    requiredCapabilities: ["mesh.control"],
    children: [],
  },
  {
    id: "realm_gw_marketing",
    name: "marketing-gateway",
    type: "gateway",
    status: "active",
    replicas: 2,
    parent: "realm_root_001",
    image: "interrealm/gateway:v1.1.5",
    providedCapabilities: ["routing.local"],
    requiredCapabilities: ["mesh.control", "finance.payment-processing"],
    children: [],
  },
]

const mockTreeNodes: TreeNode[] = [
  // Root Realm
  {
    id: "realm_root_001",
    name: "root",
    type: "realm",
    status: "active",
    parent: null,
    children: ["realm_gw_finance", "realm_gw_marketing"],
    data: mockRealms[0],
  },

  // Finance Gateway
  {
    id: "realm_gw_finance",
    name: "finance-gateway",
    type: "gateway",
    status: "active",
    parent: "realm_root_001",
    children: [
      "folder_finance_capabilities",
      "folder_finance_contracts",
      "folder_finance_pods",
      "folder_finance_agents",
      "folder_finance_bridges",
      "folder_finance_gateways",
    ],
    data: mockRealms[1],
  },

  // Finance Gateway Folders
  {
    id: "folder_finance_capabilities",
    name: "capabilities",
    type: "folder",
    parent: "realm_gw_finance",
    children: ["cap_payment", "cap_invoice"],
    data: {},
    folderType: "capabilities",
  },
  {
    id: "folder_finance_contracts",
    name: "contracts",
    type: "folder",
    parent: "realm_gw_finance",
    children: ["contract_payment"],
    data: {},
    folderType: "contracts",
  },
  {
    id: "folder_finance_pods",
    name: "pods",
    type: "folder",
    parent: "realm_gw_finance",
    children: ["pod_payment_processor"],
    data: {},
    folderType: "pods",
  },
  {
    id: "folder_finance_agents",
    name: "agents",
    type: "folder",
    parent: "realm_gw_finance",
    children: ["agent_invoice"],
    data: {},
    folderType: "agents",
  },
  {
    id: "folder_finance_bridges",
    name: "bridges",
    type: "folder",
    parent: "realm_gw_finance",
    children: ["bridge_stripe"],
    data: {},
    folderType: "bridges",
  },
  {
    id: "folder_finance_gateways",
    name: "gateways",
    type: "folder",
    parent: "realm_gw_finance",
    children: ["realm_gw_payments"],
    data: {},
    folderType: "gateways",
  },

  // Finance Gateway Resources
  {
    id: "cap_payment",
    name: "payment-processing",
    type: "capability",
    parent: "folder_finance_capabilities",
    children: [],
    data: { version: "v1.0.0", description: "Payment processing capability" },
  },
  {
    id: "cap_invoice",
    name: "invoice-management",
    type: "capability",
    parent: "folder_finance_capabilities",
    children: [],
    data: { version: "v1.0.0", description: "Invoice management capability" },
  },
  {
    id: "contract_payment",
    name: "payment-contract",
    type: "contract",
    parent: "folder_finance_contracts",
    children: [],
    data: { version: "v1.0.0", provides: ["payment-processing"] },
  },
  {
    id: "pod_payment_processor",
    name: "payment-processor",
    type: "pod",
    status: "active",
    parent: "folder_finance_pods",
    children: [],
    data: { replicas: 3, image: "finance/payment:v2.1.0" },
  },
  {
    id: "agent_invoice",
    name: "invoice-agent",
    type: "agent",
    status: "active",
    parent: "folder_finance_agents",
    children: [],
    data: { image: "finance/invoice-agent:v1.0.0" },
  },
  {
    id: "bridge_stripe",
    name: "stripe-bridge",
    type: "bridge",
    status: "connected",
    parent: "folder_finance_bridges",
    children: [],
    data: { type: "service", baseUrl: "https://api.stripe.com" },
  },

  // Payments Gateway (nested under Finance)
  {
    id: "realm_gw_payments",
    name: "payments-gateway",
    type: "gateway",
    status: "active",
    parent: "folder_finance_gateways",
    children: ["folder_payments_capabilities", "folder_payments_pods", "folder_payments_gateways"],
    data: mockRealms[2],
  },

  // Payments Gateway Folders
  {
    id: "folder_payments_capabilities",
    name: "capabilities",
    type: "folder",
    parent: "realm_gw_payments",
    children: ["cap_card_processing"],
    data: {},
    folderType: "capabilities",
  },
  {
    id: "folder_payments_pods",
    name: "pods",
    type: "folder",
    parent: "realm_gw_payments",
    children: ["pod_card_processor"],
    data: {},
    folderType: "pods",
  },
  {
    id: "folder_payments_gateways",
    name: "gateways",
    type: "folder",
    parent: "realm_gw_payments",
    children: ["realm_gw_ach"],
    data: {},
    folderType: "gateways",
  },

  // Payments Gateway Resources
  {
    id: "cap_card_processing",
    name: "card-processing",
    type: "capability",
    parent: "folder_payments_capabilities",
    children: [],
    data: { version: "v1.0.0", description: "Credit card processing" },
  },
  {
    id: "pod_card_processor",
    name: "card-processor",
    type: "pod",
    status: "active",
    parent: "folder_payments_pods",
    children: [],
    data: { replicas: 2, image: "payments/card:v1.5.0" },
  },

  // ACH Gateway (nested under Payments)
  {
    id: "realm_gw_ach",
    name: "ach-gateway",
    type: "gateway",
    status: "active",
    parent: "folder_payments_gateways",
    children: ["folder_ach_pods"],
    data: mockRealms[3],
  },

  // ACH Gateway Folders
  {
    id: "folder_ach_pods",
    name: "pods",
    type: "folder",
    parent: "realm_gw_ach",
    children: ["pod_ach_processor"],
    data: {},
    folderType: "pods",
  },

  // ACH Gateway Resources
  {
    id: "pod_ach_processor",
    name: "ach-processor",
    type: "pod",
    status: "active",
    parent: "folder_ach_pods",
    children: [],
    data: { replicas: 1, image: "payments/ach:v1.0.0" },
  },

  // Marketing Gateway
  {
    id: "realm_gw_marketing",
    name: "marketing-gateway",
    type: "gateway",
    status: "active",
    parent: "realm_root_001",
    children: ["folder_marketing_pods"],
    data: mockRealms[4],
  },

  // Marketing Gateway Folders
  {
    id: "folder_marketing_pods",
    name: "pods",
    type: "folder",
    parent: "realm_gw_marketing",
    children: ["pod_campaign_manager"],
    data: {},
    folderType: "pods",
  },

  // Marketing Gateway Resources
  {
    id: "pod_campaign_manager",
    name: "campaign-manager",
    type: "pod",
    status: "active",
    parent: "folder_marketing_pods",
    children: [],
    data: { replicas: 2, image: "marketing/campaign:v1.5.0" },
  },
]

export function GitOpsConsole() {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>("realm_root_001")
  const [currentBranch, setCurrentBranch] = useState<GitBranch>(mockBranches[0])
  const [treeNodes, setTreeNodes] = useState<TreeNode[]>(mockTreeNodes)
  const [pendingChanges, setPendingChanges] = useState<PendingChange[]>([])
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [validationStatus, setValidationStatus] = useState<"idle" | "validating" | "valid" | "invalid">("idle")
  const [validationIssues, setValidationIssues] = useState<ValidationIssue[]>([])

  useEffect(() => {
    const issues = validateTree(treeNodes)
    setValidationIssues(issues)
  }, [treeNodes, currentBranch])

  const selectedNode = treeNodes.find((n) => n.id === selectedNodeId)
  const selectedRealm =
    selectedNode?.type === "realm" || selectedNode?.type === "gateway" ? (selectedNode.data as Realm) : null

  const handleBranchChange = (branchName: string) => {
    const branch = mockBranches.find((b) => b.name === branchName)
    if (branch) {
      setCurrentBranch(branch)
      setPendingChanges([])
    }
  }

  const handleRealmUpdate = (updatedRealm: Realm) => {
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

  const handleValidate = () => {
    setValidationStatus("validating")
    setTimeout(() => {
      setValidationStatus("valid")
    }, 1500)
  }

  const handleDeploy = () => {
    setPendingChanges([])
    setValidationStatus("idle")
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

  const handleCreateResource = (folderType: string) => {
    console.log("[v0] Creating resource of type:", folderType)
    // TODO: Open appropriate create modal based on folderType
    setIsCreateModalOpen(true)
  }

  const handleNavigateToIssue = (nodeId: string) => {
    setSelectedNodeId(nodeId)
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      <TopNav
        meshInfo={mockMeshInfo}
        currentBranch={currentBranch}
        branches={mockBranches}
        onBranchChange={handleBranchChange}
        problemCount={validationIssues.filter((i) => i.severity === "error").length}
        warningCount={validationIssues.filter((i) => i.severity === "warning").length}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Unified Tree */}
        <div className="flex w-80 flex-col border-r border-border bg-card/50 backdrop-blur-sm">
          <div className="flex items-center justify-between border-b border-border bg-card/80 px-4 py-3 backdrop-blur-sm">
            <h2 className="font-semibold text-foreground">RealmMesh Tree</h2>
            <Button size="sm" variant="ghost" onClick={() => setIsCreateModalOpen(true)} className="h-8 w-8 p-0">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            <UnifiedTree
              nodes={treeNodes}
              selectedNodeId={selectedNodeId}
              onSelectNode={setSelectedNodeId}
              pendingChanges={pendingChanges}
            />
          </div>
        </div>

        {/* Main Content - Node Details with Bottom Panel */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-hidden bg-background">
            {selectedNode?.type === "folder" ? (
              <FolderDetails folder={selectedNode} allNodes={treeNodes} onCreateResource={handleCreateResource} />
            ) : selectedNode?.type === "pod" ? (
              <PodDetails pod={selectedNode} allNodes={treeNodes} />
            ) : selectedRealm ? (
              <RealmDetails realm={selectedRealm} allRealms={mockRealms} onUpdate={handleRealmUpdate} />
            ) : selectedNode ? (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <p className="text-lg font-medium">Selected: {selectedNode.name}</p>
                  <p className="text-sm">Type: {selectedNode.type}</p>
                  <p className="mt-4 text-xs">Detail view for {selectedNode.type} coming soon</p>
                </div>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                Select a node to view details
              </div>
            )}
          </div>

          {/* Bottom Panel with Tabs for Problems and Changes */}
          <BottomPanel
            issues={validationIssues}
            pendingChanges={pendingChanges}
            validationStatus={validationStatus}
            onNavigateToIssue={handleNavigateToIssue}
            onValidate={handleValidate}
            onDeploy={handleDeploy}
          />
        </div>
      </div>

      <CreateRealmModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onCreateRealm={handleCreateRealm}
        existingRealms={mockRealms}
      />
    </div>
  )
}
