"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { toast } from "sonner"
import type { BrandWithSections, OrderItem, ProductItem } from "@/lib/types"
import { useState } from "react"
import Link from "next/link"
import Image from "next/image"

const orderItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  quantity: z.union([z.string(), z.number()]).optional(),
  notes: z.string().optional(),
  selected: z.boolean().optional(),
})

const orderFormSchema = z.object({
  orderedBy: z.string().min(1, "Your name is required."),
  email: z.string().email("A valid email is required."),
  phone: z.string().min(1, "A phone number is required."),
  billTo: z.string().min(1, "Billing address is required."),
  deliverTo: z.string().min(1, "Delivery address is required."),
  specialInstructions: z.string().optional(),
  items: z.record(orderItemSchema),
})

type OrderFormValues = z.infer<typeof orderFormSchema>

type BrandWithProductItems = BrandWithSections & {
  product_sections: Array<{
    product_items: ProductItem[]
  }>
}

export default function OrderForm({ brand }: { brand: BrandWithProductItems }) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const initialItems = brand.product_sections.flatMap((section) => section.product_items)
  const defaultItems = initialItems.reduce(
    (acc, item) => {
      acc[item.id] = {
        id: item.id,
        name: item.name,
        quantity: item.quantities?.[0]?.toString() ?? "0",
        notes: "",
        selected: false,
      }
      return acc
    },
    {} as Record<string, z.infer<typeof orderItemSchema>>,
  )

  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: {
      orderedBy: "",
      email: "",
      phone: "",
      billTo: "",
      deliverTo: "",
      specialInstructions: "",
      items: defaultItems,
    },
  })

  async function onSubmit(data: OrderFormValues) {
    setIsSubmitting(true)
    const toastId = toast.loading("Submitting your order...")

    const orderedItems: OrderItem[] = Object.values(data.items)
      .filter((item) => {
        const hasQuantity = item.quantity && Number(item.quantity) > 0
        const isSelected = item.selected === true
        return hasQuantity || isSelected
      })
      .map((item) => ({
        name: item.name,
        quantity: item.selected ? 1 : Number(item.quantity!),
        notes: item.notes,
      }))

    if (orderedItems.length === 0) {
      toast.error("Please select at least one item.", { id: toastId })
      setIsSubmitting(false)
      return
    }

    const submissionData = {
      brandId: brand.id,
      brandName: brand.name,
      brandEmail: brand.email,
      orderedBy: data.orderedBy,
      email: data.email,
      phone: data.phone,
      billTo: data.billTo,
      deliverTo: data.deliverTo,
      items: orderedItems,
      specialInstructions: data.specialInstructions,
    }

    try {
      const response = await fetch("/api/submit-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submissionData),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.details || result.error || "An unknown error occurred.")
      }

      toast.success("Order submitted successfully!", {
        id: toastId,
        description: "You will receive a confirmation email shortly.",
      })
      form.reset()
    } catch (error) {
      console.error("Submission failed:", error)
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred."
      toast.error("Submission failed", {
        id: toastId,
        description: errorMessage,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <Card className="max-w-4xl mx-auto">
        <CardHeader className="text-center">
          {brand.logo && (
            <Image
              src={brand.logo || "/placeholder.svg"}
              alt={`${brand.name} Logo`}
              width={200}
              height={100}
              className="mx-auto mb-4 object-contain h-24"
            />
          )}
          <CardTitle className="text-3xl font-bold">{brand.name} Order Form</CardTitle>
          <CardDescription>Please fill out the form below to place your order.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="orderedBy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Your Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
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
                        <Input placeholder="you@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="0400 000 000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="billTo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bill To</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Billing address or instructions" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="deliverTo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Deliver To</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Delivery address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-6">
                {brand.product_sections.map((section) => (
                  <div key={section.id}>
                    <h3 className="text-xl font-semibold mb-4 border-b pb-2">{section.title}</h3>
                    <div className="space-y-4">
                      {section.product_items.map((item) => (
                        <div key={item.id} className="grid md:grid-cols-[1fr_auto_1fr] gap-4 items-start">
                          <div>
                            <p className="font-medium">{item.name}</p>
                            {item.description && <p className="text-sm text-muted-foreground">{item.description}</p>}
                            {item.sample_link && (
                              <Link
                                href={item.sample_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:underline"
                              >
                                View Sample
                              </Link>
                            )}
                          </div>

                          <div className="flex items-center justify-center pt-2">
                            {item.quantities && Array.isArray(item.quantities) && item.quantities.length > 0 ? (
                              <FormField
                                control={form.control}
                                name={`items.${item.id}.quantity`}
                                render={({ field }) => (
                                  <FormItem>
                                    <Select onValueChange={field.onChange} defaultValue={field.value?.toString()}>
                                      <FormControl>
                                        <SelectTrigger className="w-[120px]">
                                          <SelectValue placeholder="Select" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value="0">0</SelectItem>
                                        {item.quantities.map((q, i) => (
                                          <SelectItem key={i} value={q.toString()}>
                                            {q}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            ) : (
                              <FormField
                                control={form.control}
                                name={`items.${item.id}.selected`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormControl>
                                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            )}
                          </div>

                          <FormField
                            control={form.control}
                            name={`items.${item.id}.notes`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="sr-only">Notes</FormLabel>
                                <FormControl>
                                  <Input placeholder="Notes (optional)" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <FormLabel htmlFor="specialInstructions">Special Instructions</FormLabel>
                <FormField
                  control={form.control}
                  name="specialInstructions"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea
                          id="specialInstructions"
                          placeholder="Any other instructions for your order..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <CardFooter className="p-0 pt-6">
                <Button type="submit" disabled={isSubmitting} className="w-full">
                  {isSubmitting ? "Submitting..." : "Submit Order"}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
