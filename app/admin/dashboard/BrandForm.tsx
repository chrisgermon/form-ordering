"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X, Upload } from "lucide-react"
import { resolveAssetUrl } from "@/lib/utils"
import type { Brand, UploadedFile, ClinicLocation } from "@/lib/types"

interface BrandFormProps {
  brand: Brand | null
  uploadedFiles: UploadedFile[]
  onSave: (data: any) => void
  onCancel: () => void
  onLogoUpload: () => Promise<void>
}

const newLocation = (): ClinicLocation => ({ name: "", address: "", phone: "", email: "" })

const getInitialState = (brand: Brand | null) => {
  const safeArray = (value: string[] | null | undefined): string[] => {
    if (Array.isArray(value) && value.length > 0) {
      return value
    }
    return [""]
  }

  if (brand) {
    return {
      name: brand.name || "",
      logo_url: brand.logo_url || "",
      active: brand.active,
      to_emails: safeArray(brand.to_emails),
      cc_emails: safeArray(brand.cc_emails),
      bcc_emails: safeArray(brand.bcc_emails),
      clinicLocations: brand.clinic_locations?.length ? brand.clinic_locations : [newLocation()],
    }
  }
  return {
    name: "",
    logo_url: "",
    active: true,
    to_emails: [""],
    cc_emails: [""],
    bcc_emails: [""],
    clinicLocations: [newLocation()],
  }
}

export function BrandForm({ brand, uploadedFiles, onSave, onCancel, onLogoUpload }: BrandFormProps) {
  const [formData, setFormData] = useState(() => getInitialState(brand))
  const [isUploading, setIsUploading] = useState(false)

  useEffect(() => {
    setFormData(getInitialState(brand))
  }, [brand])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [id]: type === "checkbox" ? checked : value,
    }))
  }

  const handleEmailListChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number,
    listName: "to_emails" | "cc_emails" | "bcc_emails",
  ) => {
    const newList = [...formData[listName]]
    newList[index] = e.target.value
    setFormData((prev) => ({ ...prev, [listName]: newList }))
  }

  const addEmailToList = (listName: "to_emails" | "cc_emails" | "bcc_emails") => {
    setFormData((prev) => ({ ...prev, [listName]: [...prev[listName], ""] }))
  }

  const removeEmailFromList = (index: number, listName: "to_emails" | "cc_emails" | "bcc_emails") => {
    const newList = formData[listName].filter((_, i) => i !== index)
    setFormData((prev) => ({ ...prev, [listName]: newList.length > 0 ? newList : [""] }))
  }

  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>, index: number, field: keyof ClinicLocation) => {
    const newList = [...formData.clinicLocations]
    newList[index] = { ...newList[index], [field]: e.target.value }
    setFormData((prev) => ({ ...prev, clinicLocations: newList }))
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
      const response = await fetch("/api/admin/upload", { method: "POST", body: uploadFormData })
      if (response.ok) {
        const newFile = await response.json()
        await onLogoUpload()
        setFormData((prev) => ({ ...prev, logo_url: newFile.pathname }))
      } else {
        console.error("Failed to upload logo")
      }
    } catch (error) {
      console.error("Error uploading logo:", error)
    } finally {
      setIsUploading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const dataToSave = {
      ...formData,
      id: brand?.id,
      to_emails: formData.to_emails.filter((email) => email.trim() !== ""),
      cc_emails: formData.cc_emails.filter((email) => email.trim() !== ""),
      bcc_emails: formData.bcc_emails.filter((email) => email.trim() !== ""),
      clinicLocations: formData.clinicLocations.filter((loc) => loc.name.trim() !== ""),
    }
    onSave(dataToSave)
  }

  const EmailListEditor = ({
    title,
    listName,
  }: {
    title: string
    listName: "to_emails" | "cc_emails" | "bcc_emails"
  }) => (
    <div>
      <Label>{title}</Label>
      <div className="space-y-2">
        {formData[listName].map((email, index) => (
          <div key={index} className="flex items-center gap-2">
            <Input
              type="email"
              placeholder="e.g., orders@example.com"
              value={email}
              onChange={(e) => handleEmailListChange(e, index, listName)}
            />
            <Button type="button" variant="ghost" size="icon" onClick={() => removeEmailFromList(index, listName)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-2 bg-transparent"
        onClick={() => addEmailToList(listName)}
      >
        Add Email
      </Button>
    </div>
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-6 py-4 max-h-[70vh] overflow-y-auto pr-4">
      <div>
        <Label htmlFor="name">Brand Name</Label>
        <Input id="name" value={formData.name} onChange={handleChange} required />
      </div>

      <div>
        <Label>Logo</Label>
        <div className="flex items-center gap-4">
          <Select
            value={formData.logo_url || "default-logo"}
            onValueChange={(value) => setFormData((p) => ({ ...p, logo_url: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select an uploaded logo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default-logo">No Logo</SelectItem>
              {uploadedFiles
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
        {formData.logo_url && (
          <div className="mt-4 p-2 border rounded-md inline-block">
            <img
              src={resolveAssetUrl(formData.logo_url) || "/placeholder.svg"}
              alt="Brand logo preview"
              className="h-16 w-auto object-contain"
              crossOrigin="anonymous"
            />
          </div>
        )}
      </div>

      <div className="space-y-4">
        <EmailListEditor title="To Emails" listName="to_emails" />
        <EmailListEditor title="CC Emails" listName="cc_emails" />
        <EmailListEditor title="BCC Emails" listName="bcc_emails" />
      </div>

      <div>
        <Label>Clinic Locations</Label>
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
                  value={location.address}
                  onChange={(e) => handleLocationChange(e, index, "address")}
                />
              </div>
              <div>
                <Label htmlFor={`loc-email-${index}`} className="text-xs">
                  Email
                </Label>
                <Input
                  id={`loc-email-${index}`}
                  type="email"
                  value={location.email || ""}
                  onChange={(e) => handleLocationChange(e, index, "email")}
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
