"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Realm } from "@/lib/types"

interface CreateRealmModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreateRealm: (realm: Realm) => void
  existingRealms: Realm[]
}

export function CreateRealmModal({ open, onOpenChange, onCreateRealm, existingRealms }: CreateRealmModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    type: "compute" as Realm["type"],
    parent: "",
    image: "interrealm/compute:v2.0.1",
    replicas: 1,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const newRealm: Realm = {
      id: `realm_${formData.type}_${Date.now()}`,
      name: formData.name,
      type: formData.type,
      status: "inactive",
      replicas: formData.replicas,
      parent: formData.parent || null,
      image: formData.image,
      providedCapabilities: [],
      requiredCapabilities: [],
      children: [],
    }

    onCreateRealm(newRealm)
    setFormData({
      name: "",
      type: "compute",
      parent: "",
      image: "interrealm/compute:v2.0.1",
      replicas: 1,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Realm</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="my-compute-realm"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => setFormData({ ...formData, type: value as Realm["type"] })}
            >
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gateway">Gateway</SelectItem>
                <SelectItem value="compute">Compute</SelectItem>
                <SelectItem value="bridge">Bridge</SelectItem>
                <SelectItem value="sub-gateway">Sub-Gateway</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="parent">Parent Realm</Label>
            <Select value={formData.parent} onValueChange={(value) => setFormData({ ...formData, parent: value })}>
              <SelectTrigger id="parent">
                <SelectValue placeholder="Select parent realm" />
              </SelectTrigger>
              <SelectContent>
                {existingRealms
                  .filter((r) => r.type !== "compute")
                  .map((realm) => (
                    <SelectItem key={realm.id} value={realm.id}>
                      {realm.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="image">Image</Label>
            <Input
              id="image"
              value={formData.image}
              onChange={(e) => setFormData({ ...formData, image: e.target.value })}
              placeholder="interrealm/compute:v2.0.1"
              className="font-mono text-sm"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="replicas">Replicas</Label>
            <Input
              id="replicas"
              type="number"
              min="1"
              value={formData.replicas}
              onChange={(e) => setFormData({ ...formData, replicas: Number.parseInt(e.target.value) })}
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Realm</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
