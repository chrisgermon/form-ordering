"use client"

import { useEffect } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { createBrand, updateBrand } from "./actions"
import type { Brand } from "@/lib/types"
import { PlusCircle, Trash2 } from "lucide-react"

const brandSchema = z.object({
  name: z.string().min(1, "Brand name is required"),
  logo_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  primary_color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Must be a valid hex color"),
  secondary_color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Must be a valid hex color"),
  recipient_email: z.string().email("Must be a valid email address"),
  is_active: z.boolean(),
  clinics: z
    .array(
      z.object({
        name: z.string().min(1, "Clinic name cannot be empty"),
        address: z.string().min(1, "Clinic address cannot be empty"),
      }),
    )
    .optional(),
})

type BrandFormValues = z.infer<typeof brandSchema>

interface BrandEditorProps {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  brand: Brand | null
  onSuccess: () => void
}

export default function BrandEditor({ isOpen, setIsOpen, brand, onSuccess }: BrandEditorProps) {
  const { toast } = useToast()
  const isEditMode = !!brand

  const form = useForm<BrandFormValues>({
    resolver: zodResolver(brandSchema),
    defaultValues: {
      name: "",
      logo_url: "",
      primary_color: "#000000",
      secondary_color: "#ffffff",
      recipient_email: "",
      is_active: true,
      clinics: [{ name: "", address: "" }],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "clinics",
  })

  useEffect(() => {
    if (brand) {
      form.reset({
        name: brand.name,
        logo_url: brand.logo_url || "",
        primary_color: brand.primary_color || "#000000",
        secondary_color: brand.secondary_color || "#ffffff",
        recipient_email: brand.recipient_email,
        is_active: brand.is_active,
        clinics: brand.clinics && brand.clinics.length > 0 ? brand.clinics : [{ name: "", address: "" }],
      })
    } else {
      form.reset({
        name: "",
        logo_url: "",
        primary_color: "#000000",
        secondary_color: "#ffffff",
        recipient_email: "",
        is_active: true,
        clinics: [{ name: "", address: "" }],
      })
    }
  }, [brand, form])

  const onSubmit = async (values: BrandFormValues) => {
    const formData = new FormData()
    Object.entries(values).forEach(([key, value]) => {
      if (key === "clinics") {
        formData.append(key, JSON.stringify(value))
      } else {
        formData.append(key, String(value))
      }
    })

    const action = isEditMode ? updateBrand.bind(null, brand.id) : createBrand
    const result = await action(formData)

    if (result.success) {
      toast({ title: "Success", description: result.message })
      onSuccess()
    } else {
      toast({
        title: "Error",
        description: result.message || "An unexpected error occurred.",
        variant: "destructive",
      })
      if (result.errors) {
        // You can optionally display form errors here
        console.error(result.errors)
      }
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Brand" : "Create New Brand"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Brand Name</Label>
              <Input id="name" {...form.register("name")} />
              {form.formState.errors.name && (
                <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="logo_url">Logo URL</Label>
              <Input id="logo_url" {...form.register("logo_url")} />
              {form.formState.errors.logo_url && (
                <p className="text-sm text-red-500">{form.formState.errors.logo_url.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="primary_color">Primary Color</Label>
              <Input id="primary_color" type="color" {...form.register("primary_color")} />
              {form.formState.errors.primary_color && (
                <p className="text-sm text-red-500">{form.formState.errors.primary_color.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="secondary_color">Secondary Color</Label>
              <Input id="secondary_color" type="color" {...form.register("secondary_color")} />
              {form.formState.errors.secondary_color && (
                <p className="text-sm text-red-500">{form.formState.errors.secondary_color.message}</p>
              )}
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="recipient_email">Recipient Email</Label>
              <Input id="recipient_email" type="email" {...form.register("recipient_email")} />
              {form.formState.errors.recipient_email && (
                <p className="text-sm text-red-500">{form.formState.errors.recipient_email.message}</p>
              )}
            </div>
            <div className="flex items-center space-x-2 col-span-2">
              <Switch id="is_active" {...form.register("is_active")} checked={form.watch("is_active")} />
              <Label htmlFor="is_active">Active</Label>
            </div>
          </div>

          <div className="space-y-4">
            <Label>Clinics</Label>
            {fields.map((field, index) => (
              <div key={field.id} className="flex items-end gap-2">
                <div className="flex-grow space-y-2">
                  <Label htmlFor={`clinics.${index}.name`} className="text-xs">
                    Clinic Name
                  </Label>
                  <Input {...form.register(`clinics.${index}.name`)} />
                </div>
                <div className="flex-grow space-y-2">
                  <Label htmlFor={`clinics.${index}.address`} className="text-xs">
                    Clinic Address
                  </Label>
                  <Input {...form.register(`clinics.${index}.address`)} />
                </div>
                <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={() => append({ name: "", address: "" })}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Clinic
            </Button>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
