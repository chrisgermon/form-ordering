"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import type { ClientFormProps, FormValues } from "@/lib/types"
import { submitOrder } from "./actions"

// This is the named export that will be imported by page.tsx
export function ClientForm(props: ClientFormProps) {
  const { brand, locations, sections } = props

  // Dynamically build the validation schema based on props
  const formSchema = z.object({
    orderedBy: z.string().min(1, "Your name is required."),
    email: z.string().email("A valid email is required."),
    billToId: z.string().min(1, "Please select a billing location."),
    deliverToId: z.string().min(1, "Please select a delivery location."),
    notes: z.string().optional(),
    items: z.object(
      sections
        .flatMap((s) => s.items)
        .reduce(
          (acc, item) => {
            const fieldId = `item_${item.id}`
            if (item.fieldType === "number") {
              acc[fieldId] = z.coerce.number().min(0).optional()
            } else if (item.fieldType === "checkbox") {
              acc[fieldId] = z.boolean().optional().default(false)
            } else {
              acc[fieldId] = z.string().optional()
            }
            return acc
          },
          {} as Record<string, z.ZodTypeAny>,
        ),
    ),
  })

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      orderedBy: "",
      email: "",
      billToId: "",
      deliverToId: "",
      notes: "",
      items: {},
    },
  })

  async function onSubmit(formData: FormValues) {
    const toastId = toast.loading("Submitting your order...")

    const result = await submitOrder({
      brandSlug: brand.slug,
      formData,
    })

    if (result.success) {
      toast.success("Order submitted successfully!", { id: toastId })
      window.location.href = `/forms/${brand.slug}/success?orderNumber=${result.orderNumber}`
    } else {
      toast.error(result.error || "An unknown error occurred.", { id: toastId })
    }
  }

  const renderItem = (item: ClientFormProps["sections"][0]["items"][0]) => {
    const fieldName = `items.item_${item.id}` as const
    switch (item.fieldType) {
      case "number":
        return (
          <FormField
            key={item.id}
            control={form.control}
            name={fieldName}
            render={({ field }) => (
              <FormItem className="flex items-center justify-between">
                <FormLabel>{item.name}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    className="w-24"
                    {...field}
                    onChange={(e) => field.onChange(e.target.value === "" ? undefined : +e.target.value)}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        )
      case "checkbox":
        return (
          <FormField
            key={item.id}
            control={form.control}
            name={fieldName}
            render={({ field }) => (
              <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                <FormControl>
                  <Checkbox checked={field.value as boolean} onCheckedChange={field.onChange} />
                </FormControl>
                <FormLabel>{item.name}</FormLabel>
              </FormItem>
            )}
          />
        )
      case "textarea":
        return (
          <FormField
            key={item.id}
            control={form.control}
            name={fieldName}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{item.name}</FormLabel>
                <FormControl>
                  <Textarea {...field} />
                </FormControl>
              </FormItem>
            )}
          />
        )
      default:
        return (
          <FormField
            key={item.id}
            control={form.control}
            name={fieldName}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{item.name}</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
              </FormItem>
            )}
          />
        )
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <div className="text-center mb-8">
        {brand.logo && (
          <img src={brand.logo || "/placeholder.svg"} alt={`${brand.name} Logo`} className="h-20 mx-auto mb-4" />
        )}
        <h1 className="text-3xl sm:text-4xl font-bold">{brand.name} Order Form</h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Order Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="orderedBy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ordered By</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="billToId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bill To</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a location" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {locations.map((loc) => (
                            <SelectItem key={`bill-${loc.value}`} value={loc.value}>
                              {loc.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="deliverToId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Deliver To</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a location" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {locations.map((loc) => (
                            <SelectItem key={`del-${loc.value}`} value={loc.value}>
                              {loc.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Optional notes or instructions..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {sections.map((section) => (
            <Card key={section.id}>
              <CardHeader>
                <CardTitle>{section.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">{section.items.map((item) => renderItem(item))}</CardContent>
            </Card>
          ))}

          <div className="flex justify-center">
            <Button type="submit" size="lg" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Submitting..." : "Submit Order"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
