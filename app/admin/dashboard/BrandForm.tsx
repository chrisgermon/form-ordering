"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import type { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { createOrUpdateBrand } from "../actions"
import type { Brand } from "@/lib/types"
import { brandSchema } from "@/lib/schemas"

type BrandFormProps = {
  brand: Brand | null
  onSuccess: (brand: Brand) => void
  onCancel: () => void
}

export function BrandForm({ brand, onSuccess, onCancel }: BrandFormProps) {
  const form = useForm<z.infer<typeof brandSchema>>({
    resolver: zodResolver(brandSchema),
    defaultValues: {
      id: brand?.id,
      name: brand?.name || "",
      slug: brand?.slug || "",
      logo_path: brand?.logo_path || "",
    },
  })

  const { isSubmitting } = form.formState

  const onSubmit = async (values: z.infer<typeof brandSchema>) => {
    const formData = new FormData()
    formData.append("id", values.id || "")
    formData.append("name", values.name)
    formData.append("slug", values.slug)

    const logoFile = (document.getElementById("logo_path") as HTMLInputElement)?.files?.[0]
    if (logoFile) {
      formData.append("logoFile", logoFile)
    } else if (values.logo_path) {
      formData.append("logo_path", values.logo_path)
    }

    const result = await createOrUpdateBrand(formData)

    if (result.success && result.data) {
      toast.success(result.message)
      onSuccess(result.data)
    } else {
      toast.error(result.message)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{brand ? "Edit Brand" : "Add New Brand"}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
            <FormItem>
              <FormLabel>Logo</FormLabel>
              <FormControl>
                <Input id="logo_path" type="file" accept="image/*" />
              </FormControl>
              {brand?.logo_path && !form.watch("logo_path") && (
                <div className="mt-2">
                  <p className="text-sm text-muted-foreground">Current logo:</p>
                  <img src={brand.logo_path || "/placeholder.svg"} alt="Current logo" className="h-16 mt-1" />
                </div>
              )}
              <FormMessage />
            </FormItem>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
