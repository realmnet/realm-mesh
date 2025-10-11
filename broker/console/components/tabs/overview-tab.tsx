"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { RealmStatusBadge } from "../realm-status-badge"
import { RealmTypeIcon } from "../realm-type-icon"
import { Badge } from "@/components/ui/badge"
import { Save } from "lucide-react"
import type { Realm } from "@/lib/types"

interface OverviewTabProps {
  realm: Realm
  allRealms: Realm[]
  onUpdate: (realm: Realm) => void
}

export function OverviewTab({ realm, allRealms, onUpdate }: OverviewTabProps) {
  const [editedRealm, setEditedRealm] = useState(realm)
  const [hasChanges, setHasChanges] = useState(false)

  const handleChange = (field: keyof Realm, value: any) => {
    setEditedRealm((prev) => ({ ...prev, [field]: value }))
    setHasChanges(true)
  }

  const handleSave = () => {
    onUpdate(editedRealm)
    setHasChanges(false)
  }

  const parentRealm = allRealms.find((r) => r.id === realm.parent)

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="mb-4 text-lg font-semibold text-foreground">Basic Information</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={editedRealm.name} onChange={(e) => handleChange("name", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Type</Label>
            <div className="flex items-center gap-2 rounded-md border border-input bg-muted px-3 py-2">
              <RealmTypeIcon type={realm.type} className="h-4 w-4" />
              <span className="text-sm capitalize">{realm.type}</span>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <div className="flex items-center">
              <RealmStatusBadge status={realm.status} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="replicas">Replicas</Label>
            <Input
              id="replicas"
              type="number"
              value={editedRealm.replicas}
              onChange={(e) => handleChange("replicas", Number.parseInt(e.target.value))}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="image">Image</Label>
            <Input
              id="image"
              value={editedRealm.image}
              onChange={(e) => handleChange("image", e.target.value)}
              className="font-mono text-sm"
            />
          </div>
          {parentRealm && (
            <div className="space-y-2 md:col-span-2">
              <Label>Parent Realm</Label>
              <div className="flex items-center gap-2 rounded-md border border-input bg-muted px-3 py-2">
                <RealmTypeIcon type={parentRealm.type} className="h-4 w-4" />
                <span className="text-sm">{parentRealm.name}</span>
                <span className="font-mono text-xs text-muted-foreground">{parentRealm.id}</span>
              </div>
            </div>
          )}
        </div>
        {hasChanges && (
          <div className="mt-4 flex justify-end">
            <Button onClick={handleSave} size="sm">
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </div>
        )}
      </Card>

      <Card className="p-6">
        <h3 className="mb-4 text-lg font-semibold text-foreground">Capabilities</h3>
        <div className="space-y-4">
          <div>
            <Label className="mb-2 block">Provided</Label>
            <div className="flex flex-wrap gap-2">
              {realm.providedCapabilities.map((cap) => (
                <Badge key={cap} variant="secondary" className="font-mono">
                  {cap}
                </Badge>
              ))}
            </div>
          </div>
          <div>
            <Label className="mb-2 block">Required</Label>
            <div className="flex flex-wrap gap-2">
              {realm.requiredCapabilities.map((cap) => (
                <Badge key={cap} variant="outline" className="font-mono">
                  {cap}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
