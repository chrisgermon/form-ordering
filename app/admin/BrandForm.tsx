"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useFormState } from "react-dom"
import { toast } from "sonner"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog"
import type { Brand } from "@/lib/types"
import { createBrand, updateBrand } from "@/app/admin/actions"
import { resolveAssetUrl } from "@/lib/utils"
import Image from "next/image"
import { SubmitButton } from "@/components/submit-button"

interface BrandFormProps {
  brand?: Brand | null
  isOpen: boolean
  onClose: () => void
}

const initialState: { message: string; success: boolean; brand?: Brand } = {
  message: "",
  success: false,
}

export function BrandForm({ brand, isOpen, onClose }: BrandFormProps) {
  const router = useRouter()
  const [logoPreview, setLogoPreview] = useState<string | null>(null)

  const action = brand ? updateBrand.bind(null, brand.id) : createBrand
  const [state, formAction] = useFormState(action, initialState)

  useEffect(() => {
    if (brand?.logo) {
      setLogoPreview(resolveAssetUrl(brand.logo))
    } else {
      setLogoPreview(null)
    }
  }, [brand])

  useEffect(() => {
    if (state.message) {
      if (state.success) {
        toast.success("Success!", { description: state.message })
        onClose()
        router.refresh()
      } else {
        toast.error("Error", { description: state.message })
      }
    }
  }, [state, onClose, router])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{brand ? "Edit Brand" : "Create New Brand"}</DialogTitle>
        </DialogHeader>
        <form action={formAction}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input id="name" name="name" defaultValue={brand?.name || ""} className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="slug" className="text-right">
                Slug
              </Label>
              <Input id="slug" name="slug" defaultValue={brand?.slug || ""} className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="logo" className="text-right">
                Logo
              </Label>
              <Input id="logo" name="logo" type="file" className="col-span-3" onChange={handleFileChange} />
            </div>
            {logoPreview && (
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="col-start-2 col-span-3">
                  <Image
                    src={logoPreview || "/placeholder.svg"}
                    alt="Logo preview"
                    width={100}
                    height={100}
                    className="object-contain border rounded-md bg-gray-50"
                  />
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                Cancel
              </Button>
            </DialogClose>
            <SubmitButton>{brand ? "Save Changes" : "Create Brand"}</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
