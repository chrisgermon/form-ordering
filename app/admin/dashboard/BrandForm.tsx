"use client"

import { useFormState } from "react-dom"
import { useEffect } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import type { Brand } from "@/lib/types"
import { createOrUpdateBrand } from "./actions"

interface BrandFormProps {
  brand: Brand | null
  onSave: () => void
  onCancel: () => void
}

export function BrandForm({ brand, onSave, onCancel }: BrandFormProps) {
  const [state, formAction] = useFormState(createOrUpdateBrand, { success: false, message: "" })

  useEffect(() => {
    if (state.message) {
      if (state.success) {
        toast.success(state.message)
        onSave()
      } else {
        toast.error(state.message)
      }
    }
  }, [state, onSave])

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="id" value={brand?.id || ""} />

      <div>
        <Label htmlFor="name">Brand Name</Label>
        <Input id="name" name="name" defaultValue={brand?.name || ""} required />
      </div>

      <div>
        <Label htmlFor="slug">Brand Slug</Label>
        <Input id="slug" name="slug" defaultValue={brand?.slug || ""} required />
      </div>

      <div>
        <Label htmlFor="logo">Logo File</Label>
        <Input id="logo" name="logo" type="file" accept="image/*" />
        {brand?.logo_url && (
          <div className="mt-2">
            <p className="text-sm text-muted-foreground">Current logo:</p>
            <img
              src={brand.logo_url || "/placeholder.svg"}
              alt="Current Logo"
              className="h-16 w-auto rounded-md border p-1"
            />
          </div>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <Switch id="active" name="active" defaultChecked={brand?.active ?? true} />
        <Label htmlFor="active">Active</Label>
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Save Brand</Button>
      </div>
    </form>
  )
}
