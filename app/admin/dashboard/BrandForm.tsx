"use client"

import type React from "react"

import { useFormState } from "react-dom"
import { useEffect, useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { updateBrand } from "../actions"
import type { Brand } from "@/lib/types"
import Image from "next/image"
import { Upload, X } from "lucide-react"

const initialState = {
  message: "",
  success: false,
}

export function BrandForm({ brand, onClose }: { brand: Brand | null; onClose: () => void }) {
  const [state, formAction] = useFormState(updateBrand, initialState)
  const [logoPreview, setLogoPreview] = useState<string | null>(brand?.logo_url || null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (state.message) {
      if (state.success) {
        toast.success(state.message)
        onClose()
      } else {
        toast.error(state.message)
      }
    }
  }, [state, onClose])

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveLogo = () => {
    setLogoPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="id" value={brand?.id || ""} />
      <input type="hidden" name="existing_logo_url" value={brand?.logo_url || ""} />

      <div className="space-y-2">
        <Label htmlFor="name">Brand Name</Label>
        <Input id="name" name="name" defaultValue={brand?.name} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="logo">Brand Logo</Label>
        <div className="flex items-center gap-4">
          <div className="w-24 h-24 border rounded-md flex items-center justify-center bg-gray-50 overflow-hidden">
            {logoPreview ? (
              <Image
                src={logoPreview || "/placeholder.svg"}
                alt="Logo preview"
                width={96}
                height={96}
                className="object-contain"
              />
            ) : (
              <Upload className="h-8 w-8 text-gray-400" />
            )}
          </div>
          <div className="flex-grow space-y-2">
            <Input id="logo" name="logo" type="file" accept="image/*" onChange={handleFileChange} ref={fileInputRef} />
            {logoPreview && (
              <Button type="button" variant="ghost" size="sm" className="text-red-500" onClick={handleRemoveLogo}>
                <X className="h-4 w-4 mr-2" />
                Remove Logo
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="active" className="flex flex-col">
          <span>Active</span>
          <span className="text-xs font-normal text-gray-500">Make this brand visible on the homepage.</span>
        </Label>
        <Switch id="active" name="active" defaultChecked={brand ? brand.active : true} />
      </div>

      <div className="flex justify-end gap-4 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit">{brand ? "Update Brand" : "Create Brand"}</Button>
      </div>
    </form>
  )
}
