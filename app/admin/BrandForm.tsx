"use client"

import { useState, useEffect } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import type { Brand, ClinicLocation } from "@/lib/types"
import { saveBrand, fetchBrandData } from "./actions"
import { toast } from "sonner"
import { Trash2, PlusCircle, Loader2 } from "lucide-react"
import Image from "next/image"

const brandSchema = z.object({
  name: z.string().min(1, "Brand name is required"),
  website_url: z.string().url("Invalid URL").optional().or(z.literal("")),
  primary_color: z.string().optional(),
  secondary_color: z.string().optional(),
  logo_url: z.string().url("Invalid URL").optional().or(z.literal("")),
  locations: z
    .array(
      z.object({
        id: z.number().optional(),
        name: z.string().min(1, "Location name is required"),
        address: z.string().min(1, "Address is required"),
      }),
    )
    .optional(),
})

type BrandFormData = z.infer<typeof brandSchema>

interface BrandFormProps {
  isOpen: boolean
  onClose: () => void
  onSave: (brand: Brand) => void
  brand?: Brand & { clinic_locations: ClinicLocation[] }
}

export function BrandForm({ isOpen, onClose, onSave, brand }: BrandFormProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [isFetching, setIsFetching] = useState(false)

  const { register, handleSubmit, control, reset, watch, setValue } = useForm<BrandFormData>({
    resolver: zodResolver(brandSchema),
    defaultValues: {
      name: "",
      website_url: "",
      primary_color: "#000000",
      secondary_color: "#ffffff",
      logo_url: "",
      locations: [],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: "locations",
  })

  const websiteUrl = watch("website_url")
  const logoUrl = watch("logo_url")

  useEffect(() => {
    if (brand) {
      reset({
        name: brand.name,
        website_url: brand.website_url || "",
        primary_color: brand.primary_color || "#000000",
        secondary_color: brand.secondary_color || "#ffffff",
        logo_url: brand.logo_url || "",
        locations: brand.clinic_locations || [],
      })
    } else {
      reset({
        name: "",
        website_url: "",
        primary_color: "#000000",
        secondary_color: "#ffffff",
        logo_url: "",
        locations: [],
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
      if (result.data.logo_url) {
        setValue("logo_url", result.data.logo_url)
      }
      if (result.data.locations && result.data.locations.length > 0) {
        remove() // Clear existing locations
        result.data.locations.forEach((loc) => append({ name: loc.name, address: loc.address }))
      }
      toast.success("Data fetched successfully!")
    } else {
      toast.error(result.error || "Failed to fetch data.")
    }
  }

  const onSubmitHandler = async (data: BrandFormData) => {
    setIsSaving(true)
    const brandToSave = {
      ...data,
      id: brand?.id,
      slug: brand?.slug,
      locations: data.locations || [],
    }

    const result = await saveBrand(brandToSave)
    setIsSaving(false)

    if (result.success && result.data) {
      toast.success(`Brand ${brand ? "updated" : "created"} successfully!`)
      onSave(result.data as Brand)
      onClose()
    } else {
      toast.error(result.error || "Failed to save brand.")
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{brand ? "Edit Brand" : "Add New Brand"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmitHandler)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="website_url">Website URL</Label>
            <div className="flex gap-2">
              <Input id="website_url" {...register("website_url")} placeholder="https://example.com" />
              <Button type="button" onClick={handleFetchData} disabled={isFetching || !websiteUrl}>
                {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Fetch Data"}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Brand Name</Label>
            <Input id="name" {...register("name")} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="primary_color">Primary Color</Label>
              <Input id="primary_color" type="color" {...register("primary_color")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="secondary_color">Secondary Color</Label>
              <Input id="secondary_color" type="color" {...register("secondary_color")} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="logo_url">Logo URL</Label>
            <Input id="logo_url" {...register("logo_url")} placeholder="https://example.com/logo.png" />
            {logoUrl && (
              <div className="mt-2 p-2 border rounded-md flex justify-center bg-gray-50">
                <Image
                  src={logoUrl || "/placeholder.svg"}
                  alt="Logo Preview"
                  width={100}
                  height={100}
                  className="object-contain"
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-medium">Clinic Locations</h3>
            {fields.map((field, index) => (
              <div key={field.id} className="flex items-end gap-2 p-2 border rounded-md">
                <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor={`locations.${index}.name`}>Location Name</Label>
                    <Input {...register(`locations.${index}.name`)} placeholder="Main Clinic" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor={`locations.${index}.address`}>Address</Label>
                    <Input {...register(`locations.${index}.address`)} placeholder="123 Health St, Wellness City" />
                  </div>
                </div>
                <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={() => append({ name: "", address: "" })}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Location
            </Button>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Brand"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
