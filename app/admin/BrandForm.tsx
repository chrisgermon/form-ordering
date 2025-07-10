"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X, Upload, Sparkles, Loader2 } from "lucide-react"
import { resolveAssetUrl } from "@/lib/utils"
import type { ClinicLocation } from "@/lib/types"
import { fetchBrandDataFromUrl } from "./actions"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Brand {
  id: string
  name: string
  slug: string
  logo: string
  active: boolean
  emails: string[]
  clinic_locations: ClinicLocation[]
}

interface UploadedFile {
  id: string
  filename: string
  original_name: string
  url: string
  pathname: string
  uploaded_at: string
  size: number
  content_type: string | null
}

interface BrandFormProps {
  brand: Brand | null
  uploadedFiles: UploadedFile[]
  onSave: (data: any) => void
  onCancel: () => void
  onLogoUpload: () => Promise<void>
}

const newLocation = (): ClinicLocation => ({ name: "", address: "", phone: "" })

export function BrandForm({ brand, uploadedFiles, onSave, onCancel, onLogoUpload }: BrandFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    logo: "",
    active: true,
    emails: [""],
    clinicLocations: [newLocation()],
  })
  const [isUploading, setIsUploading] = useState(false)
  const [isFetchingData, setIsFetchingData] = useState(false)
  const [fetchUrl, setFetchUrl] = useState("")
  const [fetchError, setFetchError] = useState<string | null>(null)

  useEffect(() => {
    if (brand) {
      const sanitizedLocations = (brand.clinic_locations || []).map((loc) => ({
        name: loc.name || "",
        address: loc.address || "",
        phone: loc.phone || "",
      }))

      setFormData({
        name: brand.name || "",
        logo: brand.logo || "",
        active: brand.active,
        emails: brand.emails?.length > 0 ? brand.emails : [""],
        clinicLocations: sanitizedLocations.length > 0 ? sanitizedLocations : [newLocation()],
      })
    } else {
      setFormData({
        name: "",
        logo: "",
        active: true,
        emails: [""],
        clinicLocations: [newLocation()],
      })
    }
  }, [brand])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked
    setFormData((prev) => ({
      ...prev,
      [id]: type === "checkbox" ? checked : value,
    }))
  }

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const newList = [...formData.emails]
    newList[index] = e.target.value
    setFormData((prev) => ({ ...prev, emails: newList }))
  }

  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>, index: number, field: keyof ClinicLocation) => {
    const newList = [...formData.clinicLocations]
    newList[index] = { ...newList[index], [field]: e.target.value }
    setFormData((prev) => ({ ...prev, clinicLocations: newList }))
  }

  const addEmail = () => setFormData((prev) => ({ ...prev, emails: [...prev.emails, ""] }))

  const removeEmail = (index: number) => {
    const newList = formData.emails.filter((_, i) => i !== index)
    setFormData((prev) => ({ ...prev, emails: newList.length > 0 ? newList : [""] }))
  }

  const addLocation = () =>
    setFormData((prev) => ({ ...prev, clinicLocations: [...prev.clinicLocations, newLocation()] }))

  const removeLocation = (index: number) => {
    const newList = formData.clinicLocations.filter((_, i) => i !== index)
    setFormData((prev) => ({ ...prev, clinicLocations: newList.length > 0 ? newList : [newLocation()] }))
  }

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    const uploadFormData = new FormData()
    uploadFormData.append("file", file)

    try {
      const response = await fetch(`/api/admin/upload?brandId=${brand?.id || ""}`, {
        method: "POST",
        body: uploadFormData,
      })
      if (response.ok) {
        const newFile = await response.json()
        await onLogoUpload()
        setFormData((prev) => ({ ...prev, logo: newFile.pathname }))
      } else {
        console.error("Failed to upload logo")
      }
    } catch (error) {
      console.error("Error uploading logo:", error)
    } finally {
      setIsUploading(false)
    }
  }

  const handleFetchBrandData = async () => {
    if (!fetchUrl) {
      setFetchError("Please enter a URL.")
      return
    }
    setIsFetchingData(true)
    setFetchError(null)
    try {
      const result = await fetchBrandDataFromUrl(fetchUrl, brand?.id || null)
      if (result.success) {
        if (
          (formData.clinicLocations.some((l) => l.name) || formData.logo) &&
          !confirm("This will replace the current logo and clinic locations. Are you sure?")
        ) {
          setIsFetchingData(false)
          return
        }
        if (result.locations && result.locations.length > 0) {
          setFormData((prev) => ({ ...prev, clinicLocations: result.locations as ClinicLocation[] }))
        }
        if (result.logoPathname) {
          setFormData((prev) => ({ ...prev, logo: result.logoPathname! }))
          // Refresh the file list so the new logo appears in the dropdown
          await onLogoUpload()
        }
      } else {
        setFetchError(result.error || "Failed to fetch data.")
      }
    } catch (error) {
      setFetchError("An unexpected error occurred.")
    } finally {
      setIsFetchingData(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const dataToSave = {
      ...formData,
      id: brand?.id,
      emails: formData.emails.filter((email) => email.trim() !== ""),
      clinicLocations: formData.clinicLocations.filter((loc) => loc.name.trim() !== ""),
    }
    onSave(dataToSave)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 py-4 max-h-[70vh] overflow-y-auto pr-4">
      <div className="space-y-4">
        <Label>Auto-fill from Website</Label>
        <div className="p-4 border rounded-md bg-gray-50/50 space-y-3">
          <div className="flex items-center gap-2">
            <Input
              type="url"
              placeholder="https://example.com"
              value={fetchUrl}
              onChange={(e) => setFetchUrl(e.target.value)}
            />
            <Button type="button" onClick={handleFetchBrandData} disabled={isFetchingData}>
              {isFetchingData ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              Fetch Data
            </Button>
          </div>
          {fetchError && (
            <Alert variant="destructive">
              <AlertDescription>{fetchError}</AlertDescription>
            </Alert>
          )}
        </div>
      </div>

      <div>
        <Label htmlFor="name">Brand Name</Label>
        <Input id="name" value={formData.name} onChange={handleChange} required />
      </div>

      <div>
        <Label>Logo</Label>
        <div className="flex items-center gap-4">
          <Select
            value={formData.logo}
            onValueChange={(value) => setFormData((p) => ({ ...p, logo: value === "none" ? "" : value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select an uploaded logo or fetch one" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Logo</SelectItem>
              {(uploadedFiles || [])
                .filter((file) => file.content_type?.startsWith("image/"))
                .map((file) => (
                  <SelectItem key={file.id} value={file.pathname}>
                    {file.original_name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          <div className="relative">
            <Button type="button" variant="outline" asChild>
              <label htmlFor="logo-upload" className="cursor-pointer">
                <Upload className="mr-2 h-4 w-4" /> {isUploading ? "Uploading..." : "Upload"}
              </label>
            </Button>
            <Input
              id="logo-upload"
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={isUploading}
            />
          </div>
        </div>
        {formData.logo && (
          <div className="mt-4 p-2 border rounded-md inline-block">
            <img
              src={resolveAssetUrl(formData.logo) || "/placeholder.svg"}
              alt="Brand logo preview"
              className="h-16 w-auto object-contain"
            />
          </div>
        )}
      </div>

      <div>
        <Label>Recipient Emails</Label>
        <div className="space-y-2">
          {formData.emails.map((email, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                type="email"
                placeholder="e.g., orders@example.com"
                value={email}
                onChange={(e) => handleEmailChange(e, index)}
              />
              <Button type="button" variant="ghost" size="icon" onClick={() => removeEmail(index)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
        <Button type="button" variant="outline" size="sm" className="mt-2 bg-transparent" onClick={addEmail}>
          Add Email
        </Button>
      </div>

      <div>
        <Label>Clinic Locations</Label>
        <div className="space-y-4 mt-2">
          {formData.clinicLocations.map((location, index) => (
            <div key={index} className="p-4 border rounded-md space-y-3 relative">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor={`loc-name-${index}`} className="text-xs">
                    Location Name
                  </Label>
                  <Input
                    id={`loc-name-${index}`}
                    placeholder="e.g., Main Street Clinic"
                    value={location.name}
                    onChange={(e) => handleLocationChange(e, index, "name")}
                  />
                </div>
                <div>
                  <Label htmlFor={`loc-phone-${index}`} className="text-xs">
                    Phone Number
                  </Label>
                  <Input
                    id={`loc-phone-${index}`}
                    placeholder="e.g., (02) 1234 5678"
                    value={location.phone}
                    onChange={(e) => handleLocationChange(e, index, "phone")}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor={`loc-address-${index}`} className="text-xs">
                  Address
                </Label>
                <Input
                  id={`loc-address-${index}`}
                  placeholder="e.g., 123 Main St, Sydney NSW 2000"
                  value={location.address}
                  onChange={(e) => handleLocationChange(e, index, "address")}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute top-1 right-1"
                onClick={() => removeLocation(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
        <Button type="button" variant="outline" size="sm" className="mt-2 bg-transparent" onClick={addLocation}>
          Add Location
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="active"
          checked={formData.active}
          onCheckedChange={(c) => setFormData({ ...formData, active: !!c })}
        />
        <Label htmlFor="active">Active Brand</Label>
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
