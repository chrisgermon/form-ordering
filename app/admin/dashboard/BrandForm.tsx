"use client"

import { useEffect, useState } from "react"
import { useFormState, useFormStatus } from "react-dom"
import { createOrUpdateBrand } from "@/app/admin/actions"
import type { Brand, UploadedFile, ClinicLocation } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X, Loader2 } from "lucide-react"
import { toast } from "sonner"

const initialState = { success: false, message: "", errors: undefined }

function SubmitButton({ isEditing }: { isEditing: boolean }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {pending ? (isEditing ? "Saving..." : "Creating...") : isEditing ? "Save Changes" : "Create Brand"}
    </Button>
  )
}

export function BrandForm({
  brand,
  uploadedFiles,
  onCancel,
  onSuccess,
}: {
  brand: Brand | null
  uploadedFiles: UploadedFile[]
  onCancel: () => void
  onSuccess: () => void
}) {
  const [state, formAction] = useFormState(createOrUpdateBrand, initialState)
  const [locations, setLocations] = useState<ClinicLocation[]>(brand?.clinic_locations || [])

  useEffect(() => {
    if (state.success) {
      toast.success(state.message)
      onSuccess()
    } else if (state.message && state.message.startsWith("Database error")) {
      toast.error(state.message)
    }
  }, [state, onSuccess])

  const addLocation = () => setLocations([...locations, { name: "", address: "", phone: "", email: "" }])
  const removeLocation = (index: number) => setLocations(locations.filter((_, i) => i !== index))
  const handleLocationChange = (index: number, field: keyof ClinicLocation, value: string) => {
    const newLocations = [...locations]
    newLocations[index][field] = value
    setLocations(newLocations)
  }

  return (
    <form action={formAction} className="space-y-4">
      {brand?.id && <input type="hidden" name="id" value={brand.id} />}
      <input type="hidden" name="clinic_locations" value={JSON.stringify(locations)} />

      <div>
        <Label htmlFor="name">Brand Name</Label>
        <Input id="name" name="name" defaultValue={brand?.name} />
        {state.errors?.name && <p className="text-sm text-red-500 mt-1">{state.errors.name[0]}</p>}
      </div>

      <div>
        <Label htmlFor="logo_url">Logo</Label>
        <Select name="logo_url" defaultValue={brand?.logo_url || "defaultLogoValue"}>
          <SelectTrigger>
            <SelectValue placeholder="Select a logo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">No Logo</SelectItem>
            {uploadedFiles.map((file) => (
              <SelectItem key={file.id} value={file.pathname}>
                {file.original_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>To Emails (comma-separated)</Label>
        <Input name="to_emails" defaultValue={brand?.to_emails?.join(", ")} />
      </div>
      <div className="space-y-2">
        <Label>CC Emails (comma-separated)</Label>
        <Input name="cc_emails" defaultValue={brand?.cc_emails?.join(", ")} />
      </div>
      <div className="space-y-2">
        <Label>BCC Emails (comma-separated)</Label>
        <Input name="bcc_emails" defaultValue={brand?.bcc_emails?.join(", ")} />
      </div>

      <div>
        <Label>Clinic Locations</Label>
        <div className="space-y-2">
          {locations.map((loc, index) => (
            <div key={index} className="p-3 border rounded-md space-y-2 relative">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute top-1 right-1"
                onClick={() => removeLocation(index)}
              >
                <X className="h-4 w-4" />
              </Button>
              <Input
                placeholder="Location Name"
                value={loc.name}
                onChange={(e) => handleLocationChange(index, "name", e.target.value)}
              />
              <Input
                placeholder="Address"
                value={loc.address || ""}
                onChange={(e) => handleLocationChange(index, "address", e.target.value)}
              />
              <Input
                placeholder="Phone"
                value={loc.phone || ""}
                onChange={(e) => handleLocationChange(index, "phone", e.target.value)}
              />
              <Input
                placeholder="Email"
                type="email"
                value={loc.email || ""}
                onChange={(e) => handleLocationChange(index, "email", e.target.value)}
              />
            </div>
          ))}
        </div>
        <Button type="button" variant="outline" size="sm" className="mt-2 bg-transparent" onClick={addLocation}>
          Add Location
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox id="active" name="active" defaultChecked={brand?.active ?? true} />
        <Label htmlFor="active">Active Brand</Label>
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <SubmitButton isEditing={!!brand} />
      </div>
    </form>
  )
}
