"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useForm, useFieldArray, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { Brand, UploadedFile } from "@/lib/types"
import { toast } from "sonner"
import { Trash2, PlusCircle, Loader2, Upload, Sparkles } from "lucide-react"
import { fetchBrandData } from "./actions"

const brandFormSchema = z.object({
  name: z.string().min(1, "Brand name is required"),
  logo: z.string().nullable().optional(),
  active: z.boolean(),
  emails: z.array(z.object({ value: z.string().email("Invalid email address").or(z.literal("")) })),
  clinicLocations: z.array(
    z.object({
      name: z.string().min(1, "Location name is required"),
      address: z.string().optional(),
      phone: z.string().optional(),
    }),
  ),
})

type BrandFormData = z.infer<typeof brandFormSchema>

interface BrandFormProps {
  brand: Brand | null
  uploadedFiles: UploadedFile[]
  onSave: (data: any) => void
  onCancel: () => void
  onLogoUpload: () => void
}

export function BrandForm({ brand, uploadedFiles, onSave, onCancel, onLogoUpload }: BrandFormProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isFetching, setIsFetching] = useState(false)
  const [websiteUrl, setWebsiteUrl] = useState("")

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<BrandFormData>({
    resolver: zodResolver(brandFormSchema),
    defaultValues: {
      name: "",
      logo: "",
      active: true,
      emails: [],
      clinicLocations: [],
    },
  })

  const { fields: emailFields, append: appendEmail, remove: removeEmail } = useFieldArray({ control, name: "emails" })
  const {
    fields: locationFields,
    append: appendLocation,
    remove: removeLocation,
  } = useFieldArray({ control, name: "clinicLocations" })

  useEffect(() => {
    if (brand) {
      reset({
        name: brand.name,
        logo: brand.logo || "",
        active: brand.active,
        emails: brand.emails.map((email) => ({ value: email })),
        clinicLocations: brand.clinic_locations || [],
      })
    } else {
      reset({
        name: "",
        logo: "",
        active: true,
        emails: [{ value: "" }],
        clinicLocations: [{ name: "", address: "", phone: "" }],
      })
    }
  }, [brand, reset])

  const handleFetchData = async () => {
    if (!websiteUrl) {
      toast.error("Please enter a website URL to fetch data.")
      return
    }
    setIsFetching(true)
    const result = await fetchBrandData(websiteUrl, brand?.slug || "new-brand")
    setIsFetching(false)

    if (result.success && result.data) {
      if (result.data.name) setValue("name", result.data.name)
      if (result.data.logo) {
        setValue("logo", result.data.logo)
        onLogoUpload() // Refresh file list to include the new logo
      }
      if (result.data.locations && result.data.locations.length > 0) {
        setValue("clinicLocations", result.data.locations)
      }
      toast.success("Data fetched successfully!")
    } else {
      toast.error(result.error || "Failed to fetch data.")
    }
  }

  const onSubmitHandler = async (data: BrandFormData) => {
    setIsSaving(true)
    const payload = {
      id: brand?.id,
      ...data,
      emails: data.emails.map((e) => e.value).filter(Boolean),
    }
    await onSave(payload)
    setIsSaving(false)
  }

  const handleFileSelectAndUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
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
        setValue("logo", newFile.pathname, { shouldValidate: true })
        toast.success("Logo uploaded and selected.")
        onLogoUpload()
      } else {
        const errorData = await response.json()
        toast.error(`Failed to upload logo: ${errorData.error}`)
      }
    } catch (error) {
      toast.error("An error occurred during upload.")
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmitHandler)} className="flex flex-col h-full overflow-hidden">
      <div className="flex-grow overflow-y-auto pr-6 -mr-6 space-y-6">
        <div className="p-4 border rounded-md bg-blue-50 border-blue-200">
          <Label htmlFor="website_url">Fetch Data with AI</Label>
          <p className="text-sm text-muted-foreground mb-2">
            Enter a website URL to automatically populate the brand name, logo, and locations.
          </p>
          <div className="flex gap-2">
            <Input
              id="website_url"
              placeholder="https://example.com"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
            />
            <Button type="button" onClick={handleFetchData} disabled={isFetching || !websiteUrl}>
              {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              <span className="ml-2">Fetch</span>
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="name">Brand Name</Label>
          <Input id="name" {...register("name")} />
          {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="logo">Logo</Label>
          <div className="flex items-center gap-2">
            <Controller
              name="logo"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value || "default-logo"}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an uploaded logo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default-logo">No Logo</SelectItem>
                    {uploadedFiles.map((file) => (
                      <SelectItem key={file.id} value={file.pathname}>
                        {file.original_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <div className="relative">
              <Button type="button" variant="outline" asChild disabled={isUploading}>
                <label htmlFor="logo-upload" className="cursor-pointer flex items-center">
                  <Upload className="mr-2 h-4 w-4" /> {isUploading ? "Uploading..." : "Upload"}
                </label>
              </Button>
              <Input
                id="logo-upload"
                type="file"
                accept=".png,.jpg,.jpeg,.svg"
                onChange={handleFileSelectAndUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={isUploading}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Controller
            name="active"
            control={control}
            render={({ field }) => <Switch id="active" checked={field.value} onCheckedChange={field.onChange} />}
          />
          <Label htmlFor="active">Active</Label>
          <p className="text-sm text-muted-foreground">(Inactive brands will not appear on the public homepage)</p>
        </div>

        <div className="space-y-3 p-4 border rounded-md">
          <Label>Recipient Emails</Label>
          <p className="text-sm text-muted-foreground">
            These addresses will receive the order submission emails for this brand.
          </p>
          {emailFields.map((field, index) => (
            <div key={field.id} className="flex items-center gap-2">
              <Input {...register(`emails.${index}.value`)} placeholder="name@example.com" />
              <Button type="button" variant="ghost" size="icon" onClick={() => removeEmail(index)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={() => appendEmail({ value: "" })}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Email
          </Button>
        </div>

        <div className="space-y-3 p-4 border rounded-md">
          <Label>Clinic Locations</Label>
          <p className="text-sm text-muted-foreground">
            These locations will appear in the "Bill To" and "Deliver To" dropdowns on the order form.
          </p>
          {locationFields.map((field, index) => (
            <div key={field.id} className="space-y-2 p-3 border rounded-md bg-gray-50/50">
              <div className="flex justify-end">
                <Button type="button" variant="ghost" size="icon" onClick={() => removeLocation(index)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor={`clinicLocations.${index}.name`}>Location Name</Label>
                  <Input {...register(`clinicLocations.${index}.name`)} placeholder="Main Clinic" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor={`clinicLocations.${index}.phone`}>Phone Number</Label>
                  <Input {...register(`clinicLocations.${index}.phone`)} placeholder="e.g., (02) 1234 5678" />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor={`clinicLocations.${index}.address`}>Address</Label>
                <Textarea
                  {...register(`clinicLocations.${index}.address`)}
                  placeholder="123 Health St, Wellness City"
                />
              </div>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => appendLocation({ name: "", address: "", phone: "" })}
          >
            <PlusCircle className="mr-2 h-4 w-4" /> Add Location
          </Button>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Brand"}
        </Button>
      </div>
    </form>
  )
}
