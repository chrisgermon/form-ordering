"use client"

import { useForm, Controller, useFormState } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "sonner"
import { resolveAssetUrl } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import type { BrandData, Item } from "@/lib/types"

// This function now dynamically builds a validation schema based on the items' field types.
const createOrderSchema = (brandData: BrandData) => {
  const allItems = brandData.sections.flatMap((s) => s.items)

  const dynamicItemSchemas = allItems.reduce(
    (acc, item) => {
      let fieldSchema: z.ZodTypeAny

      switch (item.field_type) {
        case "checkbox":
          fieldSchema = z.boolean().default(false)
          break
        case "number":
          fieldSchema = z.string().optional()
          break
        default: // text, textarea, date, select, radio
          fieldSchema = z.string()
          if (item.is_required) {
            fieldSchema = fieldSchema.min(1, `${item.name} is required.`)
          } else {
            fieldSchema = fieldSchema.optional()
          }
      }
      acc[item.code] = fieldSchema
      return acc
    },
    {} as Record<string, z.ZodTypeAny>,
  )

  return z.object({
    orderedBy: z.string().min(1, "Your name is required."),
    email: z.string().email("A valid email is required."),
    billToId: z.string().min(1, "Please select a billing location."),
    deliverToId: z.string().min(1, "Please select a delivery location."),
    notes: z.string().optional(),
    items: z.object(dynamicItemSchemas),
  })
}

// A new helper component to render the correct form field based on its type.
const FormField = ({ item, control }: { item: Item; control: any }) => {
  const fieldName = `items.${item.code}` as const
  const { errors } = useFormState({ control, name: fieldName })
  const fieldError = errors.items?.[item.code]

  const renderField = () => {
    switch (item.field_type) {
      case "checkbox":
        return (
          <Controller
            name={fieldName}
            control={control}
            render={({ field }) => (
              <div className="flex items-center space-x-2 pt-2">
                <Checkbox id={fieldName} checked={field.value} onCheckedChange={field.onChange} />
                <Label htmlFor={fieldName} className="font-semibold leading-none">
                  {item.name}
                </Label>
              </div>
            )}
          />
        )
      case "select":
        return (
          <Controller
            name={fieldName}
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger>
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
            )}
          />
        )
      case "radio":
        return (
          <Controller
            name={fieldName}
            control={control}
            render={({ field }) => (
              <RadioGroup onValueChange={field.onChange} value={field.value} className="space-y-2">
                {item.options?.map((option) => (
                  <div key={option.id} className="flex items-center space-x-2">
                    <RadioGroupItem value={option.value} id={`${fieldName}-${option.id}`} />
                    <Label htmlFor={`${fieldName}-${option.id}`}>{option.label || option.value}</Label>
                  </div>
                ))}
              </RadioGroup>
            )}
          />
        )
      case "textarea":
        return (
          <Controller
            name={fieldName}
            control={control}
            render={({ field }) => <Textarea {...field} placeholder={item.placeholder || ""} />}
          />
        )
      case "date":
        return (
          <Controller
            name={fieldName}
            control={control}
            render={({ field }) => <Input type="date" {...field} placeholder={item.placeholder || ""} />}
          />
        )
      case "number":
        return (
          <Controller
            name={fieldName}
            control={control}
            render={({ field }) => <Input type="number" {...field} placeholder={item.placeholder || ""} />}
          />
        )
      default: // 'text' and any other case
        return (
          <Controller
            name={fieldName}
            control={control}
            render={({ field }) => <Input {...field} placeholder={item.placeholder || ""} />}
          />
        )
    }
  }

  return (
    <div key={item.id} className="space-y-2 border-t pt-4">
      {item.field_type !== "checkbox" && (
        <Label htmlFor={fieldName} className="font-semibold">
          {item.name}
        </Label>
      )}
      {renderField()}
      {item.description && <p className="text-sm text-muted-foreground">{item.description}</p>}
      {fieldError && <p className="text-sm text-destructive">{fieldError.message}</p>}
    </div>
  )
}

export function BrandFacingForm({ brandData }: { brandData: BrandData }) {
  const validationSchema = createOrderSchema(brandData)
  const allItems = brandData.sections.flatMap((s) => s.items)

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<z.infer<typeof validationSchema>>({
    resolver: zodResolver(validationSchema),
    defaultValues: {
      orderedBy: "",
      email: "",
      billToId: "",
      deliverToId: "",
      notes: "",
      items: allItems.reduce((acc, item) => {
        acc[item.code] = item.field_type === "checkbox" ? false : ""
        return acc
      }, {} as any),
    },
  })

  if (!brandData || !brandData.sections) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-lg text-muted-foreground">Loading form...</p>
      </div>
    )
  }

  const onSubmit = async (data: z.infer<typeof validationSchema>) => {
    const payload = {
      brandSlug: brandData.slug,
      orderInfo: {
        orderedBy: data.orderedBy,
        email: data.email,
        billToId: data.billToId,
        deliverToId: data.deliverToId,
        notes: data.notes,
      },
      items: data.items, // Send the raw item data
    }

    const promise = fetch("/api/submit-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    toast.promise(promise, {
      loading: "Submitting order...",
      success: async (res) => {
        if (!res.ok) {
          const errorData = await res.json()
          throw new Error(errorData.error || "Submission failed.")
        }
        reset()
        return "Order submitted successfully!"
      },
      error: (err) => err.message || "Failed to submit order.",
    })
  }

  const logoUrl = brandData.logo ? resolveAssetUrl(brandData.logo) : null

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 bg-gray-50">
      <Card className="mb-8 shadow-lg">
        <CardHeader className="text-center bg-gray-100 p-6">
          {logoUrl && (
            <img src={logoUrl || "/placeholder.svg"} alt={`${brandData.name} Logo`} className="w-48 mx-auto mb-4" />
          )}
          <CardTitle className="text-3xl font-bold">{brandData.name}</CardTitle>
          <CardDescription className="text-lg">Printing Order Form</CardDescription>
        </CardHeader>
      </Card>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Your Details</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="orderedBy">Full Name</Label>
              <Controller
                name="orderedBy"
                control={control}
                render={({ field }) => <Input {...field} id="orderedBy" />}
              />
              {errors.orderedBy && <p className="text-sm text-destructive">{errors.orderedBy.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Controller
                name="email"
                control={control}
                render={({ field }) => <Input {...field} id="email" type="email" />}
              />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="billToId">Bill To</Label>
              <Controller
                name="billToId"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger id="billToId">
                      <SelectValue placeholder="Select a billing location" />
                    </SelectTrigger>
                    <SelectContent>
                      {brandData.clinic_locations.map((loc) => (
                        <SelectItem key={loc.id} value={loc.id}>
                          {loc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.billToId && <p className="text-sm text-destructive">{errors.billToId.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="deliverToId">Deliver To</Label>
              <Controller
                name="deliverToId"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger id="deliverToId">
                      <SelectValue placeholder="Select a delivery location" />
                    </SelectTrigger>
                    <SelectContent>
                      {brandData.clinic_locations.map((loc) => (
                        <SelectItem key={loc.id} value={loc.id}>
                          {loc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.deliverToId && <p className="text-sm text-destructive">{errors.deliverToId.message}</p>}
            </div>
          </CardContent>
        </Card>

        {brandData.sections.map((section) => (
          <Card key={section.id}>
            <CardHeader>
              <CardTitle>{section.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {section.items.map((item) => (
                <FormField key={item.id} item={item} control={control} />
              ))}
            </CardContent>
          </Card>
        ))}

        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Controller
              name="notes"
              control={control}
              render={({ field }) => <Textarea {...field} placeholder="Add any special instructions here..." />}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" size="lg" disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit Order"}
          </Button>
        </div>
      </form>
    </div>
  )
}
