"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X, Upload, Bot } from "lucide-react"
import { resolveAssetUrl } from "@/lib/utils"
import type { ClinicLocation } from "@/lib/types"
import { useToast } from "@/components/ui/use-toast"
import { fetchClinicLocationsFromUrl } from "./actions"

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
  const [companyUrl, setCompanyUrl] = useState("")
  const [isFetchingLocations, setIsFetchingLocations] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (brand) {
      setFormData({
        name: brand.name || "",
        logo: brand.logo || "",
        active: brand.active,
        emails: brand.emails?.length > 0 ? brand.emails : [""],
        clinicLocations: brand.clinic_locations?.length > 0 ? brand.clinic_locations : [newLocation()],
      })
    } else {
      // Reset for new brand
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

  const addEmail = () => {
    setFormData((prev) => ({ ...prev, emails: [...prev.emails, ""] }))
  }

  const removeEmail = (index: number) => {
    const newList = formData.emails.filter((_, i) => i !== index)
    setFormData((prev) => ({ ...prev, emails: newList.length > 0 ? newList : [""] }))
  }

  const addLocation = () => {
    setFormData((prev) => ({ ...prev, clinicLocations: [...prev.clinicLocations, newLocation()] }))
  }

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
      const response = await fetch("/api/admin/upload", {
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

  const handleFetchLocations = async () => {
    if (!companyUrl) {
      toast({
        title: "URL Required",
        description: "Please enter a company URL to fetch locations.",
        variant: "destructive",
      })
      return
    }
    setIsFetchingLocations(true)
    try {
      const result = await fetchClinicLocationsFromUrl(companyUrl)
      if (result.success && result.locations) {
        const existingLocations = formData.clinicLocations.filter(
          (loc) => loc.name.trim() !== "" || loc.address.trim() !== "" || loc.phone.trim() !== "",
        )

        setFormData((prev) => ({
          ...prev,
          clinicLocations: [...existingLocations, ...result.locations],
        }))
        toast({
          title: "Success",
          description: `Found and added ${result.locations.length} new clinic locations.`,
        })
      } else {
        toast({
          title: "AI Error",
          description: result.message || "Could not fetch locations.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Unexpected Error",
        description: "An unexpected error occurred while fetching locations.",
        variant: "destructive",
      })
    } finally {
      setIsFetchingLocations(false)
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="name">Brand Name</Label>
          <Input id="name" value={formData.name} onChange={handleChange} required />
        </div>
      </div>

      <div>
        <Label>Logo</Label>
        <div className="flex items-center gap-4">
          <Select
            value={formData.logo}
            onValueChange={(value) => setFormData((p) => ({ ...p, logo: value === "none" ? "" : value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select an uploaded logo" />
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
        <div className="flex items-center gap-2 my-2 p-3 border rounded-lg bg-muted/50">
          <Input
            id="company-url"
            placeholder="Enter company website URL (e.g., https://example.com/contact)"
            value={companyUrl}
            onChange={(e) => setCompanyUrl(e.target.value)}
            className="bg-background"
          />
          <Button type="button" onClick={handleFetchLocations} disabled={isFetchingLocations}>
            <Bot className="mr-2 h-4 w-4" />
            {isFetchingLocations ? "Fetching..." : "Find Locations with AI"}
          </Button>
        </div>
        <div className="space-y-4">
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
          Add Location Manually
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
