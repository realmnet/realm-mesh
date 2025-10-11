"use client"

import { useState } from "react"
import { RegistryTree } from "./registry-tree"
import { CapabilityDetails } from "./capability-details"
import { ContractDetails } from "./contract-details"
import { TopNav } from "./top-nav"
import type { Capability, Contract, MeshInfo } from "@/lib/registry-types"

// Mock data based on OpenAPI schemas
const mockMeshInfo: MeshInfo = {
  name: "production-mesh",
  uuid: "mesh_7f3a9b2c1d4e",
  version: "1.0.0",
  environment: "production",
}

const mockCapabilities: Capability[] = [
  {
    id: "healthcare.pharmacy",
    version: "2.1.0",
    description: "Pharmacy management and drug information services",
    metadata: {
      author: "Healthcare Team",
      tags: ["healthcare", "pharmacy", "drugs"],
      stability: "stable",
      documentation: "https://docs.realmmesh.io/capabilities/healthcare.pharmacy",
    },
    domainObjects: [
      {
        name: "Drug",
        description: "Pharmaceutical drug information",
        schema: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            genericName: { type: "string" },
            dosage: { type: "string" },
            manufacturer: { type: "string" },
          },
          required: ["id", "name"],
        },
      },
      {
        name: "Prescription",
        description: "Medical prescription details",
        schema: {
          type: "object",
          properties: {
            id: { type: "string" },
            patientId: { type: "string" },
            drugId: { type: "string" },
            dosageInstructions: { type: "string" },
            refills: { type: "number" },
          },
          required: ["id", "patientId", "drugId"],
        },
      },
    ],
    services: [
      {
        name: "DrugQuery",
        description: "Query drug information by ID or name",
        timeout: 5000,
        retries: 2,
        idempotent: true,
        input: {
          domainObjectRef: "Drug",
          description: "Drug search criteria",
        },
        output: {
          domainObjectRef: "Drug",
          description: "Drug information",
        },
        errors: [
          {
            code: "DRUG_NOT_FOUND",
            httpStatus: 404,
          },
        ],
      },
      {
        name: "PrescriptionCreate",
        description: "Create a new prescription",
        timeout: 10000,
        retries: 0,
        idempotent: false,
        input: {
          domainObjectRef: "Prescription",
        },
        output: {
          domainObjectRef: "Prescription",
        },
      },
    ],
    events: [
      {
        name: "DrugRecalled",
        description: "Emitted when a drug is recalled",
        topic: "drug.recalled",
        ordering: true,
        payload: {
          domainObjectRef: "Drug",
        },
        filters: [
          {
            field: "severity",
            description: "Recall severity level",
          },
        ],
      },
    ],
    loops: [
      {
        name: "DrugInteractionCheck",
        type: "aggregation",
        description: "Check for drug interactions across multiple sources",
        recruitment: {
          recruitmentTimeout: 3000,
          minParticipants: 2,
          maxParticipants: 10,
        },
        execution: {
          executionTimeout: 15000,
          waitStrategy: "all",
        },
        aggregation: {
          strategy: "merge",
        },
      },
    ],
    loopStacks: [
      {
        name: "PharmacyNetworkSync",
        description: "Synchronize inventory across pharmacy network",
        loops: [
          {
            loopRef: "DrugInteractionCheck",
            allowSubLoops: true,
          },
        ],
      },
    ],
  },
  {
    id: "finance.trading",
    version: "1.5.0",
    description: "Financial trading and market data services",
    metadata: {
      author: "Finance Team",
      tags: ["finance", "trading", "markets"],
      stability: "stable",
    },
    domainObjects: [
      {
        name: "Trade",
        description: "Trading transaction",
        schema: {
          type: "object",
          properties: {
            id: { type: "string" },
            symbol: { type: "string" },
            quantity: { type: "number" },
            price: { type: "number" },
            timestamp: { type: "string", format: "date-time" },
          },
          required: ["id", "symbol", "quantity", "price"],
        },
      },
    ],
    services: [
      {
        name: "ExecuteTrade",
        description: "Execute a trading order",
        timeout: 2000,
        retries: 0,
        idempotent: false,
        input: {
          domainObjectRef: "Trade",
        },
        output: {
          domainObjectRef: "Trade",
        },
      },
    ],
    events: [
      {
        name: "TradeExecuted",
        description: "Emitted when a trade is executed",
        topic: "trade.executed",
        ordering: true,
        payload: {
          domainObjectRef: "Trade",
        },
      },
    ],
    loops: [],
    loopStacks: [],
  },
  {
    id: "analytics.realtime",
    version: "3.0.0",
    description: "Real-time analytics and data processing",
    metadata: {
      author: "Analytics Team",
      tags: ["analytics", "realtime", "data"],
      stability: "beta",
    },
    domainObjects: [
      {
        name: "MetricData",
        description: "Time-series metric data point",
        schema: {
          type: "object",
          properties: {
            metric: { type: "string" },
            value: { type: "number" },
            timestamp: { type: "string", format: "date-time" },
            tags: { type: "object" },
          },
          required: ["metric", "value", "timestamp"],
        },
      },
    ],
    services: [
      {
        name: "QueryMetrics",
        description: "Query metrics by time range",
        timeout: 10000,
        retries: 1,
        idempotent: true,
      },
    ],
    events: [],
    loops: [],
    loopStacks: [],
  },
]

const mockContracts: Contract[] = [
  {
    realmId: "realm_compute_001",
    version: "1.0.0",
    description: "AI inference compute realm contract",
    provides: {
      services: [
        {
          capabilityRef: "healthcare.pharmacy/v2.1.0/DrugQuery",
          endpoint: "internal://drug-service",
        },
      ],
      events: [
        {
          capabilityRef: "healthcare.pharmacy/v2.1.0/DrugRecalled",
          configuration: {
            partitions: 4,
            retentionDays: 30,
          },
        },
      ],
    },
    requires: {
      services: [
        {
          capabilityRef: "analytics.realtime/v3.0.0/QueryMetrics",
        },
      ],
    },
  },
  {
    realmId: "realm_compute_002",
    version: "1.2.0",
    description: "Data processing compute realm contract",
    provides: {
      services: [
        {
          capabilityRef: "analytics.realtime/v3.0.0/QueryMetrics",
          endpoint: "internal://analytics-service",
        },
      ],
    },
    requires: {
      services: [],
    },
  },
  {
    realmId: "realm_compute_003",
    version: "1.0.0",
    description: "Trading compute realm contract",
    provides: {
      services: [
        {
          capabilityRef: "finance.trading/v1.5.0/ExecuteTrade",
          endpoint: "internal://trading-service",
        },
      ],
      events: [
        {
          capabilityRef: "finance.trading/v1.5.0/TradeExecuted",
        },
      ],
    },
    requires: {
      services: [
        {
          capabilityRef: "analytics.realtime/v3.0.0/QueryMetrics",
        },
      ],
    },
  },
]

type SelectedItem = { type: "capability"; data: Capability } | { type: "contract"; data: Contract } | null

export function RegistryConsole() {
  const [selectedItem, setSelectedItem] = useState<SelectedItem>(null)

  const handleSelectCapability = (capability: Capability) => {
    setSelectedItem({ type: "capability", data: capability })
  }

  const handleSelectContract = (contract: Contract) => {
    setSelectedItem({ type: "contract", data: contract })
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      <TopNav meshInfo={mockMeshInfo} />

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Registry Tree */}
        <div className="flex w-80 flex-col border-r border-border bg-card/50 backdrop-blur-sm">
          <div className="flex items-center justify-between border-b border-border bg-card/80 px-4 py-3 backdrop-blur-sm">
            <h2 className="font-semibold text-foreground">Registry</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            <RegistryTree
              capabilities={mockCapabilities}
              contracts={mockContracts}
              selectedItem={selectedItem}
              onSelectCapability={handleSelectCapability}
              onSelectContract={handleSelectContract}
            />
          </div>
        </div>

        {/* Main Content - Details */}
        <div className="flex-1 overflow-hidden bg-background">
          {selectedItem?.type === "capability" && <CapabilityDetails capability={selectedItem.data} />}
          {selectedItem?.type === "contract" && <ContractDetails contract={selectedItem.data} />}
          {!selectedItem && (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              Select a capability or contract to view details
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
