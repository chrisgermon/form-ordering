"use client"

import { useEffect } from "react"
import { useFormState } from "react-dom"
import { toast } from "sonner"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

import type { Brand } from "@/lib/types"
import { addBrand, updateBrand } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"

const BrandSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Brand name is required."),
  slug: z.string().min(1, "Brand slug is required."),
  logo_url: z.string().url("Must be a valid URL.").optional().or(z.literal("")),
  active: z.boolean(),
})

interface BrandFormProps {
  brand: Brand | null
  onSave: () => void
}

export function BrandForm({ brand, onSave }: BrandFormProps) {
  const form = useForm<z.infer<typeof BrandSchema>>({
    resolver: zodResolver(BrandSchema),
    defaultValues: {
      id: brand?.id || undefined,
      name: brand?.name || "",
      slug: brand?.slug || "",
      logo_url: brand?.logo_url || "",
      active: brand?.active ?? true,
    },
  })

  const action = brand ? updateBrand : addBrand
  const [state, formAction] = useFormState(action, { success: false, message: "" })

  useEffect(() => {
    if (state.success) {
      toast.success(state.message)
      onSave()
    } else if (state.message && !state.success) {
      toast.error(state.message)
    }
  }, [state, onSave])

  return (
    <Form {...form}>
      <form action={formAction} className="space-y-4">
        {brand && <input type="hidden" name="id" value={brand.id} />}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Brand Name</FormLabel>
              <FormControl>
                <Input {...field} />
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
              <FormLabel>Brand Slug</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="logo_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Logo URL</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
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
        <Button type="submit" className="w-full">
          {brand ? "Update Brand" : "Add Brand"}
        </Button>
      </form>
    </Form>
  )
}
