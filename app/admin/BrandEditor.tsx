"use client"

import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import type { Brand } from "@/lib/types"
import { createBrand, updateBrand } from "./actions"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Trash2 } from "lucide-react"

const clinicSchema = z.object({
  name: z.string().min(1, "Clinic name is required"),
  address: z.string().min(1, "Clinic address is required"),
})

const brandSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, "Brand name is required"),
  logo_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  primary_color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Must be a valid hex color"),
  secondary_color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Must be a valid hex color"),
  recipient_email: z.string().email("Must be a valid email address"),
  is_active: z.boolean(),
  clinics: z.array(clinicSchema),
})

type BrandFormData = z.infer<typeof brandSchema>

interface BrandEditorProps {
  brand?: Brand
  isOpen: boolean
  onClose: () => void
}

export default function BrandEditor({ brand, isOpen, onClose }: BrandEditorProps) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BrandFormData>({
    resolver: zodResolver(brandSchema),
    defaultValues: {
      id: brand?.id,
      name: brand?.name || "",
      logo_url: brand?.logo_url || "",
      primary_color: brand?.primary_color || "#000000",
      secondary_color: brand?.secondary_color || "#ffffff",
      recipient_email: brand?.recipient_email || "",
      is_active: brand?.is_active ?? true,
      clinics: brand?.clinics || [],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: "clinics",
  })

  const handleFormSubmit = async (data: BrandFormData) => {
    const formData = new FormData()
    formData.append("name", data.name)
    formData.append("logo_url", data.logo_url || "")
    formData.append("primary_color", data.primary_color)
    formData.append("secondary_color", data.secondary_color)
    formData.append("recipient_email", data.recipient_email)
    formData.append("is_active", String(data.is_active))
    formData.append("clinics", JSON.stringify(data.clinics))

    let result
    if (brand?.id) {
      formData.append("id", String(brand.id))
      result = await updateBrand(formData)
    } else {
      result = await createBrand(formData)
    }

    if (result.success) {
      toast.success(result.message)
      onClose()
    } else {
      toast.error(result.message)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{brand ? "Edit Brand" : "Create New Brand"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Brand Name</Label>
              <Input id="name" {...register("name")} />
              {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
            </div>
            <div>
              <Label htmlFor="recipient_email">Recipient Email</Label>
              <Input id="recipient_email" {...register("recipient_email")} />
              {errors.recipient_email && <p className="text-red-500 text-sm">{errors.recipient_email.message}</p>}
            </div>
          </div>
          <div>
            <Label htmlFor="logo_url">Logo URL</Label>
            <Input id="logo_url" {...register("logo_url")} />
            {errors.logo_url && <p className="text-red-500 text-sm">{errors.logo_url.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="primary_color">Primary Color</Label>
              <Input id="primary_color" type="color" {...register("primary_color")} className="h-10" />
              {errors.primary_color && <p className="text-red-500 text-sm">{errors.primary_color.message}</p>}
            </div>
            <div>
              <Label htmlFor="secondary_color">Secondary Color</Label>
              <Input id="secondary_color" type="color" {...register("secondary_color")} className="h-10" />
              {errors.secondary_color && <p className="text-red-500 text-sm">{errors.secondary_color.message}</p>}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              {...register("is_active")}
              defaultChecked={brand?.is_active ?? true}
              onCheckedChange={(checked) => reset({ ...control._formValues, is_active: checked })}
            />
            <Label htmlFor="is_active">Active</Label>
          </div>

          <div>
            <h3 className="font-medium mb-2">Clinics</h3>
            <div className="space-y-2">
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-center gap-2">
                  <Input {...register(`clinics.${index}.name`)} placeholder="Clinic Name" className="flex-1" />
                  <Input {...register(`clinics.${index}.address`)} placeholder="Clinic Address" className="flex-1" />
                  <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ name: "", address: "" })}
              className="mt-2"
            >
              Add Clinic
            </Button>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Brand"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
