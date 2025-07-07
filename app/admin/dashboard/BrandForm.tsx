"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import type { z } from "zod"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { upsertBrand } from "./actions"
import { brandSchema } from "@/lib/schemas"
import type { Brand } from "@/lib/types"

type BrandFormData = z.infer<typeof brandSchema>

export function BrandForm({ brand, onSuccess }: { brand: Brand | null; onSuccess: () => void }) {
  const form = useForm<BrandFormData>({
    resolver: zodResolver(brandSchema),
    defaultValues: {
      id: brand?.id || undefined,
      name: brand?.name || "",
      slug: brand?.slug || "",
      active: brand?.active ?? true,
    },
  })

  useEffect(() => {
    form.reset({
      id: brand?.id || undefined,
      name: brand?.name || "",
      slug: brand?.slug || "",
      active: brand?.active ?? true,
    })
  }, [brand, form])

  const onSubmit = async (data: BrandFormData) => {
    const formData = new FormData()
    if (data.id) formData.append("id", data.id)
    formData.append("name", data.name)
    formData.append("slug", data.slug)
    if (data.active) formData.append("active", "on")

    const result = await upsertBrand(formData)
    if (result.success) {
      toast.success(result.message)
      onSuccess()
    } else {
      toast.error(result.message)
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>{brand ? "Edit Brand" : "Add New Brand"}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{brand ? "Edit Brand" : "Add New Brand"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <input type="hidden" {...form.register("id")} />
          <div>
            <Label htmlFor="name">Brand Name</Label>
            <Input id="name" {...form.register("name")} />
            {form.formState.errors.name && <p className="text-red-500 text-sm">{form.formState.errors.name.message}</p>}
          </div>
          <div>
            <Label htmlFor="slug">Brand Slug</Label>
            <Input id="slug" {...form.register("slug")} />
            {form.formState.errors.slug && <p className="text-red-500 text-sm">{form.formState.errors.slug.message}</p>}
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="active"
              {...form.register("active")}
              checked={form.watch("active")}
              onCheckedChange={(checked) => form.setValue("active", !!checked)}
            />
            <Label htmlFor="active">Active</Label>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Saving..." : "Save Brand"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
