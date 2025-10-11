"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { FileText, ArrowUpCircle, ArrowDownCircle } from "lucide-react"
import type { Contract } from "@/lib/registry-types"

interface ContractDetailsProps {
  contract: Contract
}

export function ContractDetails({ contract }: ContractDetailsProps) {
  const providesCount =
    (contract.provides?.services?.length || 0) +
    (contract.provides?.events?.length || 0) +
    (contract.provides?.loops?.length || 0) +
    (contract.provides?.loopStacks?.length || 0)

  const requiresCount = (contract.requires?.services?.length || 0) + (contract.requires?.events?.length || 0)

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-border bg-card/50 px-6 py-4 backdrop-blur-sm">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-primary" />
              <h1 className="font-mono text-xl font-semibold text-foreground">{contract.realmId}</h1>
              <Badge variant="outline">v{contract.version}</Badge>
            </div>
            {contract.description && <p className="text-sm text-muted-foreground">{contract.description}</p>}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="overview" className="flex h-full flex-col">
          <TabsList className="w-full justify-start rounded-none border-b border-border bg-transparent px-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="provides">
              Provides
              {providesCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {providesCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="requires">
              Requires
              {requiresCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {requiresCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto p-6">
            <TabsContent value="overview" className="mt-0 space-y-4">
              <Card className="p-4">
                <h3 className="mb-3 text-sm font-semibold text-foreground">Contract Summary</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <ArrowUpCircle className="h-4 w-4 text-green-500" />
                    <div>
                      <div className="text-2xl font-semibold text-foreground">{providesCount}</div>
                      <div className="text-muted-foreground">Provides</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <ArrowDownCircle className="h-4 w-4 text-blue-500" />
                    <div>
                      <div className="text-2xl font-semibold text-foreground">{requiresCount}</div>
                      <div className="text-muted-foreground">Requires</div>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <h3 className="mb-3 text-sm font-semibold text-foreground">Details</h3>
                <dl className="space-y-2 text-sm">
                  <div className="flex gap-2">
                    <dt className="w-24 text-muted-foreground">Realm ID:</dt>
                    <dd className="font-mono text-xs text-foreground">{contract.realmId}</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="w-24 text-muted-foreground">Version:</dt>
                    <dd className="text-foreground">{contract.version}</dd>
                  </div>
                </dl>
              </Card>
            </TabsContent>

            <TabsContent value="provides" className="mt-0 space-y-4">
              {contract.provides?.services && contract.provides.services.length > 0 && (
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-foreground">Services</h3>
                  <div className="space-y-2">
                    {contract.provides.services.map((service, idx) => (
                      <Card key={idx} className="p-3">
                        <div className="mb-1 font-mono text-xs text-foreground">{service.capabilityRef}</div>
                        {service.endpoint && (
                          <div className="text-xs text-muted-foreground">Endpoint: {service.endpoint}</div>
                        )}
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {contract.provides?.events && contract.provides.events.length > 0 && (
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-foreground">Events</h3>
                  <div className="space-y-2">
                    {contract.provides.events.map((event, idx) => (
                      <Card key={idx} className="p-3">
                        <div className="mb-1 font-mono text-xs text-foreground">{event.capabilityRef}</div>
                        {event.configuration && (
                          <div className="mt-2 rounded-md bg-muted/50 p-2">
                            <pre className="text-xs">
                              <code>{JSON.stringify(event.configuration, null, 2)}</code>
                            </pre>
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {providesCount === 0 && (
                <div className="text-center text-sm text-muted-foreground">No capabilities provided</div>
              )}
            </TabsContent>

            <TabsContent value="requires" className="mt-0 space-y-4">
              {contract.requires?.services && contract.requires.services.length > 0 && (
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-foreground">Services</h3>
                  <div className="space-y-2">
                    {contract.requires.services.map((service, idx) => (
                      <Card key={idx} className="p-3">
                        <div className="font-mono text-xs text-foreground">{service.capabilityRef}</div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {contract.requires?.events && contract.requires.events.length > 0 && (
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-foreground">Events</h3>
                  <div className="space-y-2">
                    {contract.requires.events.map((event, idx) => (
                      <Card key={idx} className="p-3">
                        <div className="font-mono text-xs text-foreground">{event.capabilityRef}</div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {requiresCount === 0 && (
                <div className="text-center text-sm text-muted-foreground">No capabilities required</div>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  )
}
