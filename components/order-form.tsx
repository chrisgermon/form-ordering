"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form"
import { DatePicker } from "@/components/ui/date-picker"
import { toast } from "@/components/ui/use-toast"
import type { BrandData } from "@/lib/types"
import { useRouter } from "next/navigation"

interface OrderFormProps {
  brandData: BrandData
}

export function OrderForm({ brandData }: OrderFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const formSchema = React.useMemo(() => {
    const itemSchemas: Record<string, z.ZodTypeAny> = {}
    // Guard against undefined sections
    ;(brandData.product_sections || []).forEach((section) => {
      // Guard against undefined items
      ;(section.product_items || []).forEach((item) => {
        let schema: z.ZodTypeAny
        switch (item.type) {
          case "text":
          case "email":
          case "phone":
          case "number":
            schema = z.string()
            if (item.is_required) {
              schema = schema.min(1, { message: `${item.label} is required.` })
            } else {
              schema = schema.optional()
            }
            if (item.type === "email") {
              schema = schema.email({ message: "Invalid email address." })
            }
            break
          case "textarea":
            schema = z.string()
            if (item.is_required) {
              schema = schema.min(1, { message: `${item.label} is required.` })
            } else {
              schema = schema.optional()
            }
            break
          case "boolean":
            schema = z.boolean().default(false)
            break
          case "select":
            schema = z.string()
            if (item.is_required) {
              schema = schema.min(1, { message: `${item.label} is required.` })
            } else {
              schema = schema.optional()
            }
            break
          case "date":
            // Dates can be optional, so they can be null
            schema = z.date().nullable()
            if (item.is_required) {
              schema = schema.refine((val) => val !== null, { message: `${item.label} is required.` })
            }
            break
          default:
            schema = z.any()
        }
        itemSchemas[item.id] = schema
      })
    })

    return z.object({
      ordered_by: z.string().min(1, "Your name is required."),
      email: z.string().email("A valid email is required."),
      phone: z.string().optional(),
      items: z.object(itemSchemas),
    })
  }, [brandData])

  const defaultValues = React.useMemo(() => {
    const values: Record<string, any> = {}
    // Guard against undefined sections
    ;(brandData.product_sections || []).forEach((section) => {
      // Guard against undefined items
      ;(section.product_items || []).forEach((item) => {
        if (item.type === "boolean") {
          values[item.id] = item.default_value === "true"
        } else if (item.type === "date") {
          // Ensure default value for date is a Date object or null
          values[item.id] = item.default_value ? new Date(item.default_value) : null
        } else {
          values[item.id] = item.default_value ?? ""
        }
      })
    })
    return {
      ordered_by: "",
      email: "",
      phone: "",
      items: values,
    }
  }, [brandData])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues,
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)
    try {
      const response = await fetch("/api/submit-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          brand_id: brandData.id,
          brand_name: brandData.name,
          brand_slug: brandData.slug,
          order_config: {
            sections: brandData.product_sections,
          },
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "An unknown error occurred.")
      }

      toast({
        title: "Order Submitted!",
        description: "Your order has been received. A confirmation has been sent to your email.",
      })
      form.reset(defaultValues)
      // Optional: redirect to a thank you page
      // router.push(`/thank-you/${brandData.slug}`);
    } catch (error: any) {
      toast({
        title: "Submission Failed",
        description: error.message,
        variant: "destructive",
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
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="ordered_by"
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
                  <FormLabel>Email Address</FormLabel>
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
                  <FormLabel>Phone Number (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Your contact number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="space-y-6">
          {/* Guard against undefined sections */}
          {(brandData.product_sections || []).map((section) => (
            <Card key={section.id}>
              <CardHeader>
                <CardTitle>{section.title}</CardTitle>
                {section.description && <CardDescription>{section.description}</CardDescription>}
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Guard against undefined items */}
                  {(section.product_items || []).map((item) => (
                    <FormField
                      key={item.id}
                      control={form.control}
                      name={`items.${item.id}`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{item.label}</FormLabel>
                          <FormControl>
                            <>
                              {item.type === "text" && <Input placeholder={item.placeholder} {...field} />}
                              {item.type === "email" && (
                                <Input type="email" placeholder={item.placeholder} {...field} />
                              )}
                              {item.type === "phone" && <Input type="tel" placeholder={item.placeholder} {...field} />}
                              {item.type === "number" && (
                                <Input type="number" placeholder={item.placeholder} {...field} />
                              )}
                              {item.type === "textarea" && <Textarea placeholder={item.placeholder} {...field} />}
                              {item.type === "boolean" && (
                                <div className="flex items-center space-x-2">
                                  <Checkbox id={item.id} checked={field.value} onCheckedChange={field.onChange} />
                                  <label
                                    htmlFor={item.id}
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                  >
                                    {item.description || item.label}
                                  </label>
                                </div>
                              )}
                              {item.type === "select" && (
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <SelectTrigger>
                                    <SelectValue placeholder={item.placeholder} />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {(item.options || []).map((option) => (
                                      <SelectItem key={option} value={option}>
                                        {option}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )}
                              {item.type === "date" && (
                                // Ensure value passed to DatePicker is a Date object
                                <DatePicker
                                  value={field.value}
                                  onChange={field.onChange}
                                  placeholder={item.placeholder || "Select a date"}
                                />
                              )}
                            </>
                          </FormControl>
                          {item.description && item.type !== "boolean" && (
                            <FormDescription>{item.description}</FormDescription>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Submitting..." : "Submit Order"}
        </Button>
      </form>
    </Form>
  )
}
