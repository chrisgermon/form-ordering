"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { useFormState, useFormStatus } from "react-dom"
import { Loader2, Upload } from "lucide-react"
import { toast } from "sonner"

import type { Brand, UploadedFile } from "@/lib/types"
import { resolveAssetUrl } from "@/lib/utils"
import { createOrUpdateBrand } from "@/app/admin/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

interface BrandFormProps {
  brand: Brand | null
  uploadedFiles: UploadedFile[]
  onCancel: () => void
  onSuccess: () => void
  onLogoUpload: () => Promise<void>
}

function SubmitButton({ isUpdating }: { isUpdating: boolean }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {pending ? (isUpdating ? "Saving..." : "Creating...") : isUpdating ? "Save Changes" : "Create Brand"}
    </Button>
  )
}

export function BrandForm({ brand, uploadedFiles, onCancel, onSuccess, onLogoUpload }: BrandFormProps) {
  const [initialState, setInitialState] = useState({ success: false, message: "", errors: null })
  const [formState, formAction] = useFormState(createOrUpdateBrand, initialState)
  const [selectedLogo, setSelectedLogo] = useState(brand?.logo_url || null)
  const [isLogoPickerOpen, setIsLogoPickerOpen] = useState(false)

  useEffect(() => {
    if (formState.success) {
      toast.success(formState.message)
      onSuccess()
    } else if (formState.message && formState !== initialState) {
      toast.error(formState.message)
    }
  }, [formState, onSuccess, initialState])

  const safeJoin = (arr: unknown) => (Array.isArray(arr) ? arr.join(", ") : "")
  const safeStringify = (val: unknown) => {
    try {
      if (!val) return "[]"
      if (typeof val === "string" && val.trim().startsWith("[")) return val
      return JSON.stringify(val, null, 2)
    } catch {
      return "[]"
    }
  }

  const handleLogoSelect = (file: UploadedFile) => {
    setSelectedLogo(file.pathname)
    setIsLogoPickerOpen(false)
  }

  return (
    <form action={formAction} className="space-y-6">
      {brand?.id && <input type="hidden" name="id" value={brand.id} />}
      <input type="hidden" name="logo_url" value={selectedLogo || ""} />

      <div className="space-y-2">
        <Label htmlFor="name">Brand Name</Label>
        <Input id="name" name="name" defaultValue={brand?.name} required />
      </div>

      <div className="flex items-center space-x-2">
        <Label htmlFor="active">Active</Label>
        <Switch id="active" name="active" defaultChecked={brand?.active ?? true} />
      </div>

      <div>
        <Label>Logo</Label>
        <div className="mt-2 flex items-center gap-4">
          <div className="w-32 h-16 rounded border flex items-center justify-center bg-gray-50">
            {selectedLogo ? (
              <Image
                src={resolveAssetUrl(selectedLogo) || "/placeholder.svg"}
                alt="Selected Logo"
                width={128}
                height={64}
                className="object-contain"
              />
            ) : (
              <span className="text-xs text-muted-foreground">No Logo</span>
            )}
          </div>
          <Dialog open={isLogoPickerOpen} onOpenChange={setIsLogoPickerOpen}>
            <DialogTrigger asChild>
              <Button type="button" variant="outline">
                <Upload className="mr-2 h-4 w-4" />
                Choose Logo
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Choose a Logo</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-4 max-h-[60vh] overflow-y-auto p-4">
                {uploadedFiles.map((file) => (
                  <button
                    type="button"
                    key={file.id}
                    className="border rounded-md p-2 hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring"
                    onClick={() => handleLogoSelect(file)}
                  >
                    <Image
                      src={resolveAssetUrl(file.pathname) || "/placeholder.svg"}
                      alt={file.original_name}
                      width={100}
                      height={100}
                      className="object-contain w-full h-20"
                    />
                    <p className="text-xs truncate mt-2">{file.original_name}</p>
                  </button>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="to_emails">"To" Emails (comma-separated)</Label>
        <Input id="to_emails" name="to_emails" defaultValue={safeJoin(brand?.to_emails)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="cc_emails">"CC" Emails (comma-separated)</Label>
        <Input id="cc_emails" name="cc_emails" defaultValue={safeJoin(brand?.cc_emails)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="bcc_emails">"BCC" Emails (comma-separated)</Label>
        <Input id="bcc_emails" name="bcc_emails" defaultValue={safeJoin(brand?.bcc_emails)} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="clinic_locations">Clinic Locations (JSON Array)</Label>
        <Textarea
          id="clinic_locations"
          name="clinic_locations"
          defaultValue={safeStringify(brand?.clinic_locations)}
          rows={5}
          placeholder='[&#10;  "Location 1",&#10;  "Location 2"&#10;]'
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <SubmitButton isUpdating={!!brand} />
      </div>
    </form>
  )
}
