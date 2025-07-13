"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { useFormState } from "react-dom"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import Image from "next/image"
import { toast } from "sonner"
import { createBrand, updateBrand } from "./actions"
import { resolveAssetUrl } from "@/lib/utils"
import type { Brand } from "@/lib/types"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Trash2, PlusCircle } from "lucide-react"
import { SubmitButton } from "@/components/submit-button"

const formSchema = z.object({
  name: z.string().min(2, "Brand name must be at least 2 characters."),
  slug: z.string().min(2, "Slug must be at least 2 characters."),
  active: z.boolean().default(true),
  emails: z.array(z.string().email("Invalid email address.")).min(1, "At least one email is required."),
  clinic_locations: z
    .array(
      z.object({
        name: z.string().min(1, "Location name is required."),
        address: z.string().min(1, "Address is required."),
        phone: z.string().optional(),
        email: z.string().email("Invalid email address.").optional().or(z.literal("")),
      }),
    )
    .optional(),
  logo: z.any().optional(),
})

type BrandFormProps = {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  brand?: Brand | null
  onFormSuccess: () => void | Promise<void>
}

export function BrandForm({ isOpen, onOpenChange, brand, onFormSuccess }: BrandFormProps) {
  const [logoPreview, setLogoPreview] = useState<string | null>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      slug: "",
      active: true,
      emails: [],
      clinic_locations: [],
    },
  })

  const {
    fields: emailFields,
    append: appendEmail,
    remove: removeEmail,
  } = useFieldArray({
    control: form.control,
    name: "emails",
  })

  const {
    fields: locationFields,
    append: appendLocation,
    remove: removeLocation,
  } = useFieldArray({
    control: form.control,
    name: "clinic_locations",
  })

  useEffect(() => {
    if (brand) {
      form.reset({
        name: brand.name,
        slug: brand.slug,
        active: brand.active,
        emails: brand.emails || [],
        clinic_locations: brand.clinic_locations || [],
      })
      if (brand.logo) {
        setLogoPreview(resolveAssetUrl(brand.logo))
      }
    } else {
      form.reset({
        name: "",
        slug: "",
        active: true,
        emails: [""],
        clinic_locations: [],
      })
      setLogoPreview(null)
    }
  }, [brand, form])

  const action = brand ? updateBrand.bind(null, brand.id) : createBrand
  const [state, formAction] = useFormState(action, { message: "", success: false })

  useEffect(() => {
    if (state.message) {
      if (state.success) {
        toast.success(state.message)
        onFormSuccess()
        onOpenChange(false)
      } else {
        toast.error(state.message)
      }
    }
  }, [state, onOpenChange, onFormSuccess])

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const formData = new FormData()
    Object.entries(values).forEach(([key, value]) => {
      if (key === "logo") {
        if (value && value.length > 0) {
          formData.append("logo", value[0])
        }
      } else if (key === "clinic_locations" || key === "emails") {
        formData.append(key, JSON.stringify(value))
      } else {
        formData.append(key, String(value))
      }
    })

    const actionToCall = brand ? updateBrand.bind(null, brand.id) : createBrand
    formAction(formData)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{brand ? "Edit Brand" : "Create New Brand"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Brand Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Focus Radiology" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Slug</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. focus-radiology" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="logo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Logo</FormLabel>
                  <FormControl>
                    <Input type="file" accept="image/*" onChange={handleFileChange} />
                  </FormControl>
                  {logoPreview && (
                    <div className="mt-2">
                      <Image
                        src={logoPreview || "/placeholder.svg"}
                        alt="Logo Preview"
                        width={100}
                        height={100}
                        className="rounded-md border object-contain"
                      />
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Active</FormLabel>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <div>
              <Label>Recipient Emails</Label>
              <div className="space-y-2 mt-2">
                {emailFields.map((field, index) => (
                  <FormField
                    key={field.id}
                    control={form.control}
                    name={`emails.${index}`}
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center gap-2">
                          <FormControl>
                            <Input {...field} placeholder={`email@domain.com`} />
                          </FormControl>
                          <Button type="button" variant="ghost" size="icon" onClick={() => removeEmail(index)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2 bg-transparent"
                onClick={() => appendEmail("")}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Email
              </Button>
            </div>

            <div>
              <Label>Clinic Locations</Label>
              <div className="space-y-4 mt-2">
                {locationFields.map((field, index) => (
                  <div key={field.id} className="p-4 border rounded-md space-y-2 relative">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() => removeLocation(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <FormField
                      control={form.control}
                      name={`clinic_locations.${index}.name`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Location Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`clinic_locations.${index}.address`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address</FormLabel>
                          <FormControl>
                            <Textarea {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`clinic_locations.${index}.phone`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`clinic_locations.${index}.email`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2 bg-transparent"
                onClick={() => appendLocation({ name: "", address: "", phone: "", email: "" })}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Location
              </Button>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <SubmitButton>{brand ? "Save Changes" : "Create Brand"}</SubmitButton>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
