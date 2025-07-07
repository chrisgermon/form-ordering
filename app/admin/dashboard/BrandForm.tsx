"use client"

import { useEffect, useRef } from "react"
import { useFormState, useFormStatus } from "react-dom"
import { upsertBrand } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import type { Brand } from "@/lib/types"
import { toast } from "sonner"

interface BrandFormProps {
  brand: Brand | null
  onSuccess: () => void
}

const initialState = { success: false, message: "", errors: null }

function SubmitButton({ isEditing }: { isEditing: boolean }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? (isEditing ? "Saving..." : "Creating...") : isEditing ? "Save Changes" : "Create Brand"}
    </Button>
  )
}

export function BrandForm({ brand, onSuccess }: BrandFormProps) {
  const [state, formAction] = useFormState(upsertBrand, initialState)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state.success) {
      toast.success(state.message)
      formRef.current?.reset()
      onSuccess()
    } else if (state.message) {
      toast.error(state.message)
    }
  }, [state, onSuccess])

  useEffect(() => {
    if (brand) {
      formRef.current?.elements.namedItem("name")?.setAttribute("value", brand.name)
      formRef.current?.elements.namedItem("slug")?.setAttribute("value", brand.slug)
      formRef.current?.elements.namedItem("logo_url")?.setAttribute("value", brand.logo_url || "")
      const activeSwitch = formRef.current?.elements.namedItem("active") as HTMLInputElement
      if (activeSwitch) activeSwitch.checked = brand.active
    } else {
      formRef.current?.reset()
    }
  }, [brand])

  return (
    <Card>
      <CardHeader>
        <CardTitle>{brand ? "Edit Brand" : "Create New Brand"}</CardTitle>
      </CardHeader>
      <form action={formAction} ref={formRef}>
        <CardContent className="space-y-4">
          {brand && <input type="hidden" name="id" value={brand.id} />}
          <div className="space-y-2">
            <Label htmlFor="name">Brand Name</Label>
            <Input id="name" name="name" defaultValue={brand?.name} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">Slug</Label>
            <Input id="slug" name="slug" defaultValue={brand?.slug} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="logo_url">Logo URL</Label>
            <Input id="logo_url" name="logo_url" defaultValue={brand?.logo_url || ""} />
          </div>
          <div className="flex items-center space-x-2">
            <Switch id="active" name="active" defaultChecked={brand?.active ?? true} />
            <Label htmlFor="active">Active</Label>
          </div>
        </CardContent>
        <CardFooter>
          <SubmitButton isEditing={!!brand} />
        </CardFooter>
      </form>
    </Card>
  )
}
