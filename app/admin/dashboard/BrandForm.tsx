"use client"

import type React from "react"

import { useFormState, useFormStatus } from "react-dom"
import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { toast } from "sonner"
import { updateBrand } from "@/app/admin/actions"
import type { Brand } from "@/lib/types"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { X } from "lucide-react"

function SubmitButton({ isEditing }: { isEditing: boolean }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving..." : isEditing ? "Update Brand" : "Create Brand"}
    </Button>
  )
}

export function BrandForm({ brand }: { brand?: Brand }) {
  const [state, formAction] = useFormState(updateBrand, { success: false, message: "" })
  const formRef = useRef<HTMLFormElement>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(brand?.logo_url || null)

  useEffect(() => {
    if (state.success) {
      toast.success(state.message)
      if (!brand) {
        formRef.current?.reset()
        setImagePreview(null)
      }
    } else if (state.message) {
      toast.error(state.message)
    }
  }, [state, brand])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setImagePreview(null)
    // This requires a hidden input to signal removal if we want to delete from storage
    // For now, we just clear the preview and the file input
    const fileInput = formRef.current?.querySelector('input[type="file"]') as HTMLInputElement
    if (fileInput) {
      fileInput.value = ""
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{brand ? "Edit Brand" : "Create New Brand"}</CardTitle>
      </CardHeader>
      <form ref={formRef} action={formAction}>
        <CardContent className="space-y-4">
          {brand && <input type="hidden" name="id" value={brand.id} />}
          <input type="hidden" name="existing_logo_url" value={brand?.logo_url || ""} />

          <div className="space-y-2">
            <Label htmlFor="name">Brand Name</Label>
            <Input id="name" name="name" defaultValue={brand?.name} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">Brand Slug</Label>
            <Input id="slug" name="slug" defaultValue={brand?.slug} required />
          </div>

          <div className="flex items-center space-x-2">
            <Switch id="active" name="active" defaultChecked={brand?.active ?? true} />
            <Label htmlFor="active">Active</Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="logo">Logo</Label>
            <Input id="logo" name="logo" type="file" accept="image/*" onChange={handleFileChange} />
            {imagePreview && (
              <div className="mt-2 relative w-32 h-32">
                <Image src={imagePreview || "/placeholder.svg"} alt="Logo preview" layout="fill" objectFit="contain" />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                  onClick={removeImage}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <SubmitButton isEditing={!!brand} />
        </CardFooter>
      </form>
    </Card>
  )
}
