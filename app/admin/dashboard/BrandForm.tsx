"use client"

import type React from "react"

import { useFormState } from "react-dom"
import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { updateBrand } from "@/app/admin/actions"
import type { Brand } from "@/lib/types"
import Image from "next/image"

export function BrandForm({ brand, children }: { brand?: Brand; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const [state, formAction] = useFormState(updateBrand, { success: false, message: "" })
  const [preview, setPreview] = useState<string | null>(brand?.logo_url || null)

  useEffect(() => {
    if (state.message) {
      if (state.success) {
        toast.success(state.message)
        setOpen(false)
      } else {
        toast.error(state.message)
      }
    }
  }, [state])

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{brand ? "Edit Brand" : "Add New Brand"}</DialogTitle>
        </DialogHeader>
        <form ref={formRef} action={formAction} className="space-y-4">
          <input type="hidden" name="id" value={brand?.id || ""} />
          <div>
            <Label htmlFor="name">Brand Name</Label>
            <Input id="name" name="name" defaultValue={brand?.name || ""} required />
          </div>
          <div>
            <Label htmlFor="slug">Brand Slug</Label>
            <Input id="slug" name="slug" defaultValue={brand?.slug || ""} required />
          </div>
          <div className="flex items-center space-x-2">
            <Switch id="active" name="active" defaultChecked={brand?.active ?? true} />
            <Label htmlFor="active">Active</Label>
          </div>
          <div>
            <Label htmlFor="logo">Logo</Label>
            <Input id="logo" name="logo" type="file" accept="image/*" onChange={handleLogoChange} />
            <input type="hidden" name="existing_logo_url" value={brand?.logo_url || ""} />
            {preview && (
              <div className="mt-4">
                <Image
                  src={preview || "/placeholder.svg"}
                  alt="Logo preview"
                  width={100}
                  height={100}
                  className="object-contain"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit">Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
