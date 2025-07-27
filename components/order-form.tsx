"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useFieldArray } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import type { BrandWithSectionsAndItems } from "@/lib/types"
import { useState } from "react"

const itemSchema = z.object({
  id: z.string(),
  name: z.string(),
  quantity: z.number().min(0).optional(),
  is_stationery: z.boolean(),
  checked: z.boolean().optional(),
})

const sectionSchema = z.object({
  id: z.string(),
  name: z.string(),
  items: z.array(itemSchema),
})

const formSchema = z.object({
  clinic: z.string().min(1, "Please select a clinic."),
  practitionerName: z.string().min(1, "Practitioner name is required."),
  email: z.string().email("Invalid email address."),
  sections: z.array(sectionSchema),
})

type OrderFormValues = z.infer<typeof formSchema>

interface OrderFormProps {
  brand: BrandWithSectionsAndItems
}

export function OrderForm({ brand }: OrderFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const defaultValues: OrderFormValues = {
    clinic: "",
    practitionerName: "",
    email: "",
    sections:
      brand.sections?.map((section) => ({
        ...section,
        items:
          section.items?.map((item) => ({
            ...item,
            quantity: 0,
            checked: false,
          })) || [],
      })) || [],
  }

  const form = useForm<OrderFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  })

  const { fields: sectionFields } = useFieldArray({
    control: form.control,
    name: "sections",
  })

  async function onSubmit(data: OrderFormValues) {
    setIsSubmitting(true)
    const orderDetails = data.sections
      .flatMap((section) =>
        section.items
          .filter((item) => (item.is_stationery ? item.checked : (item.quantity || 0) > 0))
          .map((item) => ({
            name: item.name,
            quantity: item.is_stationery ? "Checked" : item.quantity,
          })),
      )
      .filter((item) => item.quantity)

    if (orderDetails.length === 0) {
      toast.error("No items selected", {
        description: "Please select at least one item to order.",
      })
      setIsSubmitting(false)
      return
    }

    const submissionData = {
      brand_id: brand.id,
      clinic: data.clinic,
      practitioner_name: data.practitionerName,
      email: data.email,
      order_details: orderDetails,
    }

    try {
      const response = await fetch("/api/submit-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submissionData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to submit order.")
      }

      toast.success("Order submitted successfully!", {
        description: "You will receive a confirmation email shortly.",
      })
      form.reset(defaultValues)
    } catch (error: any) {
      console.error("Submission error:", error)
      toast.error("Submission failed", {
        description: error.message || "An unexpected error occurred. Please try again later.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Your Details</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <FormField
              control={form.control}
              name="clinic"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Clinic</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your clinic" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {brand.clinics?.map((clinic: any) => (
                        <SelectItem key={clinic.name} value={clinic.name}>
                          {clinic.name}
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
              name="practitionerName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Practitioner Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Dr. John Smith" {...field} />
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
                    <Input type="email" placeholder="john.smith@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {sectionFields.map((section, sectionIndex) => (
          <Card key={section.id}>
            <CardHeader>
              <CardTitle>{section.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {section.items.map((item, itemIndex) => (
                <div key={item.id} className="flex items-center justify-between">
                  <FormLabel>{item.name}</FormLabel>
                  {item.is_stationery ? (
                    <FormField
                      control={form.control}
                      name={`sections.${sectionIndex}.items.${itemIndex}.checked`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  ) : (
                    <FormField
                      control={form.control}
                      name={`sections.${sectionIndex}.items.${itemIndex}.quantity`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              type="number"
                              className="w-24"
                              min="0"
                              {...field}
                              onChange={(e) => field.onChange(Number.parseInt(e.target.value, 10))}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        ))}

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit Order"}
        </Button>
      </form>
    </Form>
  )
}
