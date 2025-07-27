"use client"

import { useEffect } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import type { Brand } from "@/lib/types"
import { createBrand, updateBrand, deleteBrand } from "./actions"
import { Loader2, PlusCircle, Trash2 } from "lucide-react"

export const brandFormSchema = z.object({
  name: z.string().min(1, "Brand name is required."),
  logo: z.string().url("Must be a valid URL.").optional().or(z.literal("")),
  primary_color: z.string().optional(),
  email: z.string().email("Invalid email address.").optional().or(z.literal("")),
  active: z.boolean(),
  clinics: z
    .array(
      z.object({
        name: z.string().min(1, "Clinic name cannot be empty."),
        address: z.string().min(1, "Clinic address cannot be empty."),
      }),
    )
    .min(1, "At least one clinic is required."),
})

type BrandFormValues = z.infer<typeof brandFormSchema>

interface BrandEditorProps {
  isOpen: boolean
  onClose: () => void
  brand: Brand | null
}

export default function BrandEditor({ isOpen, onClose, brand }: BrandEditorProps) {
  const { toast } = useToast()
  const isCreating = brand === null

  const form = useForm<BrandFormValues>({
    resolver: zodResolver(brandFormSchema),
    defaultValues: {
      name: "",
      logo: "",
      primary_color: "#000000",
      email: "",
      active: true,
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
        logo: brand.logo || "",
        primary_color: brand.primary_color || "#000000",
        email: brand.email || "",
        active: brand.active,
        clinics: brand.clinics && brand.clinics.length > 0 ? brand.clinics : [{ name: "", address: "" }],
      })
    } else {
      form.reset({
        name: "",
        logo: "",
        primary_color: "#000000",
        email: "",
        active: true,
        clinics: [{ name: "", address: "" }],
      })
    }
  }, [brand, form, isOpen])

  const { isSubmitting } = form.formState

  const onSubmit = async (values: BrandFormValues) => {
    const action = isCreating ? createBrand : (data: BrandFormValues) => updateBrand(brand!.id, data)
    const result = await action(values)

    if (result.success) {
      toast({
        title: "Success!",
        description: result.message,
      })
      onClose()
    } else {
      toast({
        title: "Error",
        description: result.message,
        variant: "destructive",
      })
    }
  }

  const handleDelete = async () => {
    if (!brand || !confirm(`Are you sure you want to delete the brand "${brand.name}"? This cannot be undone.`)) {
      return
    }
    const result = await deleteBrand(brand.id)
    if (result.success) {
      toast({
        title: "Brand Deleted",
        description: result.message,
      })
      onClose()
    } else {
      toast({
        title: "Error",
        description: result.message,
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[625px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isCreating ? "Create New Brand" : "Edit Brand"}</DialogTitle>
          <DialogDescription>
            {isCreating ? "Add a new brand to the system." : `Editing details for ${brand?.name}.`}
          </DialogDescription>
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
              <Label htmlFor="email">Recipient Email</Label>
              <Input id="email" type="email" {...form.register("email")} />
              {form.formState.errors.email && (
                <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="logo">Logo URL</Label>
              <Input id="logo" {...form.register("logo")} />
              {form.formState.errors.logo && (
                <p className="text-sm text-red-500">{form.formState.errors.logo.message}</p>
              )}
            </div>
            <div className="flex items-center gap-4">
              <div className="space-y-2">
                <Label htmlFor="primary_color">Primary Color</Label>
                <Input id="primary_color" type="color" {...form.register("primary_color")} className="p-1 h-10" />
              </div>
              <div className="space-y-2 pt-6">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="active"
                    checked={form.watch("active")}
                    onCheckedChange={(checked) => form.setValue("active", checked)}
                  />
                  <Label htmlFor="active">Active</Label>
                </div>
              </div>
            </div>
          </div>

          <div>
            <Label>Clinics</Label>
            <div className="space-y-2 mt-2">
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-end gap-2 p-3 border rounded-md">
                  <div className="grid grid-cols-2 gap-2 flex-grow">
                    <div className="space-y-1">
                      <Label htmlFor={`clinics.${index}.name`} className="text-xs">
                        Clinic Name
                      </Label>
                      <Input {...form.register(`clinics.${index}.name`)} />
                      {form.formState.errors.clinics?.[index]?.name && (
                        <p className="text-sm text-red-500">{form.formState.errors.clinics?.[index]?.name?.message}</p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor={`clinics.${index}.address`} className="text-xs">
                        Clinic Address
                      </Label>
                      <Input {...form.register(`clinics.${index}.address`)} />
                      {form.formState.errors.clinics?.[index]?.address && (
                        <p className="text-sm text-red-500">
                          {form.formState.errors.clinics?.[index]?.address?.message}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(index)}
                    disabled={fields.length <= 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                className="w-full bg-transparent"
                onClick={() => append({ name: "", address: "" })}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Clinic
              </Button>
              {form.formState.errors.clinics?.root && (
                <p className="text-sm text-red-500">{form.formState.errors.clinics.root.message}</p>
              )}
            </div>
          </div>

          <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-between pt-4">
            <div>
              {!isCreating && (
                <Button type="button" variant="destructive" onClick={handleDelete} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="mr-2 h-4 w-4" />
                  )}
                  Delete
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isCreating ? "Create Brand" : "Save Changes"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
