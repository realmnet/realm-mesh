"use client"

import { useState } from "react"
import { ChevronRight, ChevronDown, Package, FileText } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import type { Capability, Contract } from "@/lib/registry-types"

interface RegistryTreeProps {
  capabilities: Capability[]
  contracts: Contract[]
  selectedItem: { type: "capability"; data: Capability } | { type: "contract"; data: Contract } | null
  onSelectCapability: (capability: Capability) => void
  onSelectContract: (contract: Contract) => void
}

export function RegistryTree({
  capabilities,
  contracts,
  selectedItem,
  onSelectCapability,
  onSelectContract,
}: RegistryTreeProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["capabilities", "contracts"]))

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev)
      if (next.has(section)) {
        next.delete(section)
      } else {
        next.add(section)
      }
      return next
    })
  }

  const isCapabilitySelected = (cap: Capability) =>
    selectedItem?.type === "capability" && selectedItem.data.id === cap.id && selectedItem.data.version === cap.version

  const isContractSelected = (contract: Contract) =>
    selectedItem?.type === "contract" &&
    selectedItem.data.realmId === contract.realmId &&
    selectedItem.data.version === contract.version

  const getStabilityColor = (stability?: string) => {
    switch (stability) {
      case "stable":
        return "bg-green-500/20 text-green-400"
      case "beta":
        return "bg-yellow-500/20 text-yellow-400"
      case "experimental":
        return "bg-orange-500/20 text-orange-400"
      case "deprecated":
        return "bg-red-500/20 text-red-400"
      default:
        return "bg-gray-500/20 text-gray-400"
    }
  }

  return (
    <div className="space-y-1">
      {/* Capabilities Section */}
      <div>
        <button
          onClick={() => toggleSection("capabilities")}
          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium text-foreground hover:bg-accent"
        >
          {expandedSections.has("capabilities") ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
          <Package className="h-4 w-4" />
          <span>Capabilities</span>
          <Badge variant="secondary" className="ml-auto text-xs">
            {capabilities.length}
          </Badge>
        </button>

        {expandedSections.has("capabilities") && (
          <div className="ml-4 mt-1 space-y-0.5">
            {capabilities.map((capability) => (
              <button
                key={`${capability.id}-${capability.version}`}
                onClick={() => onSelectCapability(capability)}
                className={cn(
                  "flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors",
                  isCapabilitySelected(capability)
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                )}
              >
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-medium">{capability.id}</span>
                    <Badge variant="outline" className="text-xs">
                      v{capability.version}
                    </Badge>
                  </div>
                  {capability.metadata?.stability && (
                    <Badge className={cn("text-xs", getStabilityColor(capability.metadata.stability))}>
                      {capability.metadata.stability}
                    </Badge>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Contracts Section */}
      <div>
        <button
          onClick={() => toggleSection("contracts")}
          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium text-foreground hover:bg-accent"
        >
          {expandedSections.has("contracts") ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
          <FileText className="h-4 w-4" />
          <span>Contracts</span>
          <Badge variant="secondary" className="ml-auto text-xs">
            {contracts.length}
          </Badge>
        </button>

        {expandedSections.has("contracts") && (
          <div className="ml-4 mt-1 space-y-0.5">
            {contracts.map((contract) => (
              <button
                key={`${contract.realmId}-${contract.version}`}
                onClick={() => onSelectContract(contract)}
                className={cn(
                  "flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors",
                  isContractSelected(contract)
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                )}
              >
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-medium">{contract.realmId}</span>
                    <Badge variant="outline" className="text-xs">
                      v{contract.version}
                    </Badge>
                  </div>
                  {contract.description && <p className="text-xs text-muted-foreground">{contract.description}</p>}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
