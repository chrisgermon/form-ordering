"use client"

import type { BrandData, ClinicLocation, Item, Section } from "@/lib/types"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useState } from "react"
import { submitOrder } from "@/app/api/submit-order/route"
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/components/ui/use-toast"

// Dynamically generate Zod schema from brand data
const generateSchema = (brandData: BrandData) => {
  const schemaFields: Record<string, z.ZodTypeAny> = {
    orderedBy: z.string().min(1, "Your name is required"),
    email: z.string().email("Invalid email address"),
    billTo: z.string().min(1, "Billing location is required"),
    deliverTo: z.string().min(1, "Delivery location is required"),
    notes: z.string().optional(),
  }

  brandData.sections.forEach((section) => {
    section.items.forEach((item) => {
      const fieldName = `item_${item.id}`
      let fieldSchema: z.ZodTypeAny

      switch (item.field_type) {
        case "text":
        case "textarea":
        case "date":
          fieldSchema = z.string()
          break
        case "select":
        case "radio":
          fieldSchema = z.string()
          break
        case "checkbox":
          // For a group of checkboxes, expect an array of strings
          if (item.options && item.options.length > 1) {
            fieldSchema = z.array(z.string()).optional()
          } else {
            // For a single checkbox, expect a boolean
            fieldSchema = z.boolean().default(false)
          }
          break
        default:
          fieldSchema = z.any()
      }

      if (item.is_required) {
        if (fieldSchema instanceof z.ZodString) {
          fieldSchema = fieldSchema.min(1, `${item.name} is required.`)
        } else if (fieldSchema instanceof z.ZodArray) {
          fieldSchema = fieldSchema.min(1, `Please select at least one option for ${item.name}.`)
        }
      } else {
        fieldSchema = fieldSchema.optional()
      }
      schemaFields[fieldName] = fieldSchema
    })
  })

  return z.object(schemaFields)
}

export function BrandFacingForm({ brandData }: { brandData: BrandData }) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const FormSchema = generateSchema(brandData)
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      orderedBy: "",
      email: "",
      billTo: "",
      deliverTo: "",
      notes: "",
    },
  })

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    setIsSubmitting(true)
    try {
      const result = await submitOrder(brandData.slug, data)
      if (result.success) {
        toast({
          title: "Order Submitted!",
          description: "Your order has been successfully submitted. A confirmation email is on its way.",
        })
        form.reset()
      } else {
        throw new Error(result.message || "An unknown error occurred.")
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred."
      toast({
        title: "Submission Failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderField = (item: Item) => {
    const fieldName = `item_${item.id}` as const
    const error = form.formState.errors[fieldName]

    return (
      <div key={item.id} className="mb-6">
        <Label htmlFor={fieldName} className="text-lg font-semibold text-gray-800">
          {item.name}
          {item.is_required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        {item.description && <p className="text-sm text-gray-500 mb-2">{item.description}</p>}

        <Controller
          name={fieldName}
          control={form.control}
          render={({ field }) => {
            switch (item.field_type) {
              case "text":
                return (
                  <Input {...field} id={fieldName} placeholder={item.placeholder || ""} value={field.value || ""} />
                )
              case "textarea":
                return (
                  <Textarea {...field} id={fieldName} placeholder={item.placeholder || ""} value={field.value || ""} />
                )
              case "date":
                return <Input type="date" {...field} id={fieldName} value={field.value || ""} />
              case "select":
                return (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger id={fieldName}>
                      <SelectValue placeholder={item.placeholder || "Select an option"} />
                    </SelectTrigger>
                    <SelectContent>
                      {item.options?.map((option) => (
                        <SelectItem key={option.id} value={option.value}>
                          {option.label || option.value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )
              case "radio":
                return (
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex flex-col space-y-1"
                  >
                    {item.options?.map((option) => (
                      <div key={option.id} className="flex items-center space-x-3">
                        <RadioGroupItem value={option.value} id={`${fieldName}-${option.id}`} />
                        <Label htmlFor={`${fieldName}-${option.id}`}>{option.label || option.value}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                )
              case "checkbox":
                // Handle checkbox group
                if (item.options && item.options.length > 1) {
                  return (
                    <div>
                      {item.options.map((option) => (
                        <div key={option.id} className="flex items-center space-x-2 mb-2">
                          <Checkbox
                            id={`${fieldName}-${option.id}`}
                            checked={(field.value as string[])?.includes(option.value)}
                            onCheckedChange={(checked) => {
                              const currentValue = (field.value as string[]) || []
                              if (checked) {
                                field.onChange([...currentValue, option.value])
                              } else {
                                field.onChange(currentValue.filter((v) => v !== option.value))
                              }
                            }}
                          />
                          <Label htmlFor={`${fieldName}-${option.id}`}>{option.label || option.value}</Label>
                        </div>
                      ))}
                    </div>
                  )
                }
                // Handle single checkbox
                return (
                  <div className="flex items-center space-x-2">
                    <Checkbox id={fieldName} checked={!!field.value} onCheckedChange={field.onChange} />
                    <Label htmlFor={fieldName}>{item.placeholder || "Confirm"}</Label>
                  </div>
                )
              default:
                return <p>Unsupported field type: {item.field_type}</p>
            }
          }}
        />
        {error && <p className="text-sm font-medium text-red-500 mt-1">{String(error.message)}</p>}
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4">
      <Toaster />
      <Card className="shadow-lg">
        <CardHeader className="bg-gray-50 p-6 border-b">
          <div className="flex items-center space-x-4">
            {brandData.logo && (
              <Image
                src={brandData.logo || "/placeholder.svg"}
                alt={`${brandData.name} Logo`}
                width={80}
                height={80}
                className="object-contain"
              />
            )}
            <CardTitle className="text-3xl font-bold text-gray-800">{brandData.name} Order Form</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-8">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Order Info Section */}
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold border-b pb-2">Order Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="orderedBy" className="font-semibold">
                    Your Name<span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Input id="orderedBy" {...form.register("orderedBy")} />
                  {form.formState.errors.orderedBy && (
                    <p className="text-sm text-red-500 mt-1">{form.formState.errors.orderedBy.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="email" className="font-semibold">
                    Your Email<span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Input id="email" type="email" {...form.register("email")} />
                  {form.formState.errors.email && (
                    <p className="text-sm text-red-500 mt-1">{form.formState.errors.email.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="billTo" className="font-semibold">
                    Bill To<span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Controller
                    name="billTo"
                    control={form.control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select billing location" />
                        </SelectTrigger>
                        <SelectContent>
                          {(brandData.clinic_locations as ClinicLocation[])?.map((loc) => (
                            <SelectItem key={loc.name} value={loc.name}>
                              {loc.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {form.formState.errors.billTo && (
                    <p className="text-sm text-red-500 mt-1">{form.formState.errors.billTo.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="deliverTo" className="font-semibold">
                    Deliver To<span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Controller
                    name="deliverTo"
                    control={form.control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select delivery location" />
                        </SelectTrigger>
                        <SelectContent>
                          {(brandData.clinic_locations as ClinicLocation[])?.map((loc) => (
                            <SelectItem key={loc.name} value={loc.name}>
                              {loc.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {form.formState.errors.deliverTo && (
                    <p className="text-sm text-red-500 mt-1">{form.formState.errors.deliverTo.message}</p>
                  )}
                </div>
              </div>
              <div>
                <Label htmlFor="notes" className="font-semibold">
                  Notes / Special Instructions
                </Label>
                <Textarea id="notes" {...form.register("notes")} />
              </div>
            </div>

            {/* Dynamic Form Sections */}
            {brandData.sections.map((section: Section) => (
              <div key={section.id} className="space-y-6 pt-6 border-t">
                <h2 className="text-2xl font-semibold">{section.title}</h2>
                {section.items.map((item: Item) => renderField(item))}
              </div>
            ))}

            <Button type="submit" className="w-full text-lg py-6" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit Order"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
