"use client"

import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "sonner"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import type { BrandData } from "@/lib/types"
import { CalendarIcon } from "lucide-react"

// Dynamically build the Zod schema from the form structure
const buildZodSchema = (brandData: BrandData) => {
  if (!brandData || !brandData.sections) {
    return z.object({}) // Return empty schema if data is not ready
  }

  const schemaShape = brandData.sections.reduce(
    (acc, section) => {
      section.items.forEach((item) => {
        let fieldSchema: z.ZodTypeAny

        switch (item.field_type) {
          case "text":
          case "textarea":
            fieldSchema = z.string()
            break
          case "date":
            fieldSchema = z.date().nullable()
            break
          case "select":
            fieldSchema = z.string()
            break
          case "checkbox_group":
            fieldSchema = z.array(z.string())
            break
          default:
            fieldSchema = z.any()
        }

        if (item.is_required) {
          if (item.field_type === "checkbox_group") {
            fieldSchema = (fieldSchema as z.ZodArray<any>).min(1, { message: "Please select at least one option." })
          } else {
            fieldSchema = (fieldSchema as z.ZodString).min(1, { message: "This field is required." })
          }
        } else {
          fieldSchema = fieldSchema.optional()
        }

        acc[item.code] = fieldSchema
      })
      return acc
    },
    {} as Record<string, z.ZodTypeAny>,
  )

  return z.object(schemaShape)
}

export function BrandFacingForm({ brandData }: { brandData: BrandData }) {
  const validationSchema = buildZodSchema(brandData)
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    resolver: zodResolver(validationSchema),
  })

  // Defensive check to prevent crash
  if (!brandData || !brandData.sections) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-lg text-muted-foreground">Loading form...</p>
      </div>
    )
  }

  const onSubmit = async (data: z.infer<typeof validationSchema>) => {
    const promise = fetch("/api/submit-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brandId: brandData.id, formData: data }),
    })

    toast.promise(promise, {
      loading: "Submitting order...",
      success: (res) => {
        if (!res.ok) throw new Error("Submission failed.")
        reset()
        return "Order submitted successfully!"
      },
      error: "Failed to submit order.",
    })
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
      <Card className="mb-8">
        <CardHeader className="text-center">
          {brandData.logo_url && (
            <img
              src={brandData.logo_url || "/placeholder.svg"}
              alt={`${brandData.name} Logo`}
              className="w-48 mx-auto mb-4"
            />
          )}
          <CardTitle className="text-3xl font-bold">{brandData.name} Order Form</CardTitle>
        </CardHeader>
      </Card>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {brandData.sections.map((section) => (
          <Card key={section.id}>
            <CardHeader>
              <CardTitle>{section.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {section.items.map((item) => (
                <div key={item.id}>
                  <Label htmlFor={item.code} className="text-base font-semibold">
                    {item.name} {item.is_required && <span className="text-destructive">*</span>}
                  </Label>
                  {item.description && <p className="text-sm text-muted-foreground mb-2">{item.description}</p>}

                  <Controller
                    name={item.code}
                    control={control}
                    render={({ field }) => {
                      switch (item.field_type) {
                        case "text":
                          return <Input {...field} id={item.code} placeholder={item.placeholder} />
                        case "textarea":
                          return <Textarea {...field} id={item.code} placeholder={item.placeholder} />
                        case "select":
                          return (
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <SelectTrigger id={item.code}>
                                <SelectValue placeholder={item.placeholder || "Select an option"} />
                              </SelectTrigger>
                              <SelectContent>
                                {(item.options || []).map((option) => (
                                  <SelectItem key={option} value={option}>
                                    {option}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )
                        case "date":
                          return (
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !field.value && "text-muted-foreground",
                                  )}
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0">
                                <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                              </PopoverContent>
                            </Popover>
                          )
                        case "checkbox_group":
                          return (
                            <div className="space-y-2 rounded-md border p-4">
                              {(item.options || []).map((option) => (
                                <div key={option} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`${item.code}-${option}`}
                                    checked={field.value?.includes(option)}
                                    onCheckedChange={(checked) => {
                                      const currentValue = field.value || []
                                      if (checked) {
                                        field.onChange([...currentValue, option])
                                      } else {
                                        field.onChange(currentValue.filter((v: string) => v !== option))
                                      }
                                    }}
                                  />
                                  <Label htmlFor={`${item.code}-${option}`}>{option}</Label>
                                </div>
                              ))}
                            </div>
                          )
                        default:
                          return <p>Unsupported field type</p>
                      }
                    }}
                  />
                  {errors[item.code] && (
                    <p className="text-sm font-medium text-destructive mt-2">{errors[item.code]?.message as string}</p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
        <div className="flex justify-end">
          <Button type="submit" size="lg" disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit Order"}
          </Button>
        </div>
      </form>
    </div>
  )
}
