"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Package, Box, Zap, Radio, Layers } from "lucide-react"
import type { Capability } from "@/lib/registry-types"

interface CapabilityDetailsProps {
  capability: Capability
}

export function CapabilityDetails({ capability }: CapabilityDetailsProps) {
  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-border bg-card/50 px-6 py-4 backdrop-blur-sm">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <Package className="h-5 w-5 text-primary" />
              <h1 className="font-mono text-xl font-semibold text-foreground">{capability.id}</h1>
              <Badge variant="outline">v{capability.version}</Badge>
              {capability.metadata?.stability && (
                <Badge
                  className={
                    capability.metadata.stability === "stable"
                      ? "bg-green-500/20 text-green-400"
                      : capability.metadata.stability === "beta"
                        ? "bg-yellow-500/20 text-yellow-400"
                        : "bg-orange-500/20 text-orange-400"
                  }
                >
                  {capability.metadata.stability}
                </Badge>
              )}
            </div>
            {capability.description && <p className="text-sm text-muted-foreground">{capability.description}</p>}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="overview" className="flex h-full flex-col">
          <TabsList className="w-full justify-start rounded-none border-b border-border bg-transparent px-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="domain-objects">
              Domain Objects
              {capability.domainObjects && capability.domainObjects.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {capability.domainObjects.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="services">
              Services
              {capability.services && capability.services.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {capability.services.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="loop-stacks">
              Loop Stacks
              {capability.loopStacks && capability.loopStacks.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {capability.loopStacks.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="events">
              Events
              {capability.events && capability.events.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {capability.events.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto p-6">
            <TabsContent value="overview" className="mt-0 space-y-4">
              <Card className="p-4">
                <h3 className="mb-3 text-sm font-semibold text-foreground">Metadata</h3>
                <dl className="space-y-2 text-sm">
                  {capability.metadata?.author && (
                    <div className="flex gap-2">
                      <dt className="w-24 text-muted-foreground">Author:</dt>
                      <dd className="text-foreground">{capability.metadata.author}</dd>
                    </div>
                  )}
                  {capability.metadata?.tags && capability.metadata.tags.length > 0 && (
                    <div className="flex gap-2">
                      <dt className="w-24 text-muted-foreground">Tags:</dt>
                      <dd className="flex flex-wrap gap-1">
                        {capability.metadata.tags.map((tag) => (
                          <Badge key={tag} variant="secondary">
                            {tag}
                          </Badge>
                        ))}
                      </dd>
                    </div>
                  )}
                  {capability.metadata?.documentation && (
                    <div className="flex gap-2">
                      <dt className="w-24 text-muted-foreground">Docs:</dt>
                      <dd>
                        <a
                          href={capability.metadata.documentation}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {capability.metadata.documentation}
                        </a>
                      </dd>
                    </div>
                  )}
                </dl>
              </Card>

              <Card className="p-4">
                <h3 className="mb-3 text-sm font-semibold text-foreground">Summary</h3>
                <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
                  <div className="flex items-center gap-2">
                    <Box className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-2xl font-semibold text-foreground">
                        {capability.domainObjects?.length || 0}
                      </div>
                      <div className="text-muted-foreground">Domain Objects</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-2xl font-semibold text-foreground">{capability.services?.length || 0}</div>
                      <div className="text-muted-foreground">Services</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Radio className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-2xl font-semibold text-foreground">{capability.events?.length || 0}</div>
                      <div className="text-muted-foreground">Events</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-2xl font-semibold text-foreground">{capability.loopStacks?.length || 0}</div>
                      <div className="text-muted-foreground">Loop Stacks</div>
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="domain-objects" className="mt-0 space-y-3">
              {capability.domainObjects && capability.domainObjects.length > 0 ? (
                capability.domainObjects.map((obj) => (
                  <Card key={obj.name} className="p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <Box className="h-4 w-4 text-primary" />
                      <h3 className="font-mono text-sm font-semibold text-foreground">{obj.name}</h3>
                    </div>
                    {obj.description && <p className="mb-3 text-sm text-muted-foreground">{obj.description}</p>}
                    <div className="rounded-md bg-muted/50 p-3">
                      <pre className="overflow-x-auto text-xs">
                        <code>{JSON.stringify(obj.schema, null, 2)}</code>
                      </pre>
                    </div>
                  </Card>
                ))
              ) : (
                <div className="text-center text-sm text-muted-foreground">No domain objects defined</div>
              )}
            </TabsContent>

            <TabsContent value="services" className="mt-0 space-y-3">
              {capability.services && capability.services.length > 0 ? (
                capability.services.map((service) => (
                  <Card key={service.name} className="p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <Zap className="h-4 w-4 text-primary" />
                      <h3 className="font-mono text-sm font-semibold text-foreground">{service.name}</h3>
                      {service.idempotent && (
                        <Badge variant="secondary" className="text-xs">
                          Idempotent
                        </Badge>
                      )}
                    </div>
                    {service.description && <p className="mb-3 text-sm text-muted-foreground">{service.description}</p>}
                    <dl className="space-y-2 text-sm">
                      <div className="flex gap-2">
                        <dt className="w-20 text-muted-foreground">Timeout:</dt>
                        <dd className="text-foreground">{service.timeout || 30000}ms</dd>
                      </div>
                      <div className="flex gap-2">
                        <dt className="w-20 text-muted-foreground">Retries:</dt>
                        <dd className="text-foreground">{service.retries || 0}</dd>
                      </div>
                      {service.input && (
                        <div className="flex gap-2">
                          <dt className="w-20 text-muted-foreground">Input:</dt>
                          <dd className="font-mono text-xs text-foreground">
                            {service.input.domainObjectRef || service.input.externalRef || "inline schema"}
                          </dd>
                        </div>
                      )}
                      {service.output && (
                        <div className="flex gap-2">
                          <dt className="w-20 text-muted-foreground">Output:</dt>
                          <dd className="font-mono text-xs text-foreground">
                            {service.output.domainObjectRef || service.output.externalRef || "inline schema"}
                          </dd>
                        </div>
                      )}
                    </dl>
                  </Card>
                ))
              ) : (
                <div className="text-center text-sm text-muted-foreground">No services defined</div>
              )}
            </TabsContent>

            <TabsContent value="loop-stacks" className="mt-0 space-y-3">
              {capability.loopStacks && capability.loopStacks.length > 0 ? (
                capability.loopStacks.map((stack) => (
                  <Card key={stack.name} className="p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <Layers className="h-4 w-4 text-primary" />
                      <h3 className="font-mono text-sm font-semibold text-foreground">{stack.name}</h3>
                    </div>
                    {stack.description && <p className="mb-3 text-sm text-muted-foreground">{stack.description}</p>}
                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold text-muted-foreground">Loops:</h4>
                      {stack.loops.map((loop, idx) => (
                        <div key={idx} className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2 text-sm">
                          <span className="font-mono text-xs text-foreground">{loop.loopRef}</span>
                          {loop.allowSubLoops && (
                            <Badge variant="secondary" className="text-xs">
                              Sub-loops allowed
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </Card>
                ))
              ) : (
                <div className="text-center text-sm text-muted-foreground">No loop stacks defined</div>
              )}
            </TabsContent>

            <TabsContent value="events" className="mt-0 space-y-3">
              {capability.events && capability.events.length > 0 ? (
                capability.events.map((event) => (
                  <Card key={event.name} className="p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <Radio className="h-4 w-4 text-primary" />
                      <h3 className="font-mono text-sm font-semibold text-foreground">{event.name}</h3>
                      {event.ordering && (
                        <Badge variant="secondary" className="text-xs">
                          Ordered
                        </Badge>
                      )}
                    </div>
                    {event.description && <p className="mb-3 text-sm text-muted-foreground">{event.description}</p>}
                    <dl className="space-y-2 text-sm">
                      <div className="flex gap-2">
                        <dt className="w-20 text-muted-foreground">Topic:</dt>
                        <dd className="font-mono text-xs text-foreground">{event.topic}</dd>
                      </div>
                      {event.payload && (
                        <div className="flex gap-2">
                          <dt className="w-20 text-muted-foreground">Payload:</dt>
                          <dd className="font-mono text-xs text-foreground">
                            {event.payload.domainObjectRef || event.payload.externalRef || "inline schema"}
                          </dd>
                        </div>
                      )}
                    </dl>
                  </Card>
                ))
              ) : (
                <div className="text-center text-sm text-muted-foreground">No events defined</div>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  )
}
