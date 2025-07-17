"use client"

import React from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"

import { submitOrder } from "./actions"
import type { ClientFormParams } from "@/lib/types"

export const ClientForm = ({ data }: { data: string }) => {
  const router = useRouter()
  const [formState, setFormState] = React.useState<{
    isLoading: boolean
    data: ClientFormParams | null
    error: string | null
  }>({ isLoading: true, data: null, error: null })

  // Parse data with extensive error handling and logging
  React.useEffect(() => {
    console.log("=== CLIENT FORM DEBUG: Starting data parsing ===")
    console.log("Raw data received:", data)
    console.log("Data type:", typeof data)
    console.log("Data length:", data?.length)

    try {
      const parsedData = JSON.parse(data)
      console.log("Successfully parsed data:", parsedData)
      console.log("Parsed data type:", typeof parsedData)

      // Validate the structure
      if (!parsedData || typeof parsedData !== "object") {
        throw new Error("Parsed data is not an object")
      }

      if (!parsedData.brandSlug || typeof parsedData.brandSlug !== "string") {
        throw new Error("Missing or invalid brandSlug")
      }

      if (!Array.isArray(parsedData.locationOptions)) {
        throw new Error("locationOptions is not an array")
      }

      if (!Array.isArray(parsedData.sections)) {
        throw new Error("sections is not an array")
      }

      // Validate each location option
      parsedData.locationOptions.forEach((option: any, index: number) => {
        console.log(`Validating location option ${index}:`, option)
        if (!option || typeof option !== "object") {
          throw new Error(`Location option ${index} is not an object`)
        }
        if (typeof option.value !== "string") {
          throw new Error(`Location option ${index} value is not a string: ${typeof option.value}`)
        }
        if (typeof option.label !== "string") {
          throw new Error(`Location option ${index} label is not a string: ${typeof option.label}`)
        }
      })

      console.log("Data validation passed")
      setFormState({ isLoading: false, data: parsedData, error: null })
    } catch (error) {
      console.error("CRITICAL: Failed to parse or validate form data:", error)
      console.error("Error details:", {
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      })

      const errorMessage = error instanceof Error ? error.message : "Unknown parsing error"
      setFormState({ isLoading: false, data: null, error: errorMessage })
      toast.error(`Form data error: ${errorMessage}`)
    }
  }, [data])

  const formSchema = React.useMemo(() => {
    if (!formState.data) {
      console.log("No form data available for schema creation")
      return z.object({})
    }

    console.log("Creating form schema with data:", formState.data)

    const itemSchema = z.object(
      formState.data.sections
        .flatMap((section) => section.items)
        .reduce(
          (acc, item) => {
            console.log(`Creating schema for item: ${item.id} (${item.name})`)

            let fieldSchema: z.ZodTypeAny
            switch (item.field_type) {
              case "checkbox":
                fieldSchema = z.boolean().default(false)
                break
              case "number":
                fieldSchema = z.coerce.number({ invalid_type_error: "Must be a number" }).optional().or(z.literal(""))
                break
              default:
                fieldSchema = z.string().optional()
            }

            if (item.is_required) {
              if (item.field_type === "checkbox") {
                fieldSchema = z.literal(true, { errorMap: () => ({ message: "This box must be checked." }) })
              } else if (item.field_type === "number") {
                fieldSchema = z.coerce.number({ required_error: "This field is required." }).min(0)
              } else {
                fieldSchema = z.string().min(1, { message: "This field is required." })
              }
            }

            acc[item.id] = fieldSchema
            return acc
          },
          {} as Record<string, z.ZodTypeAny>,
        ),
    )

    const schema = z.object({
      orderedBy: z.string().min(1, "Your name is required."),
      email: z.string().email("Please enter a valid email address."),
      billTo: z.string().min(1, "Please select a billing location."),
      deliverTo: z.string().min(1, "Please select a delivery location."),
      notes: z.string().optional(),
      items: itemSchema,
    })

    console.log("Form schema created successfully")
    return schema
  }, [formState.data])

  type FormValues = z.infer<typeof formSchema>

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema as any),
  })

  // Set default values when data is loaded
  React.useEffect(() => {
    if (formState.data) {
      console.log("Setting form default values")

      const defaultValues = {
        orderedBy: "",
        email: "",
        billTo: "",
        deliverTo: "",
        notes: "",
        items: formState.data.sections
          .flatMap((s) => s.items)
          .reduce((acc, item) => {
            acc[item.id] = item.field_type === "checkbox" ? false : ""
            return acc
          }, {} as any),
      }

      console.log("Default values:", defaultValues)
      form.reset(defaultValues)
    }
  }, [formState.data, form])

  async function onSubmit(formData: FormValues) {
    if (!formState.data) {
      console.error("Cannot submit: no form data available")
      return
    }

    console.log("Submitting form with data:", formData)

    const toastId = toast.loading("Submitting your order, please wait...")

    try {
      const result = await submitOrder({
        brandSlug: formState.data.brandSlug,
        orderInfo: {
          orderedBy: formData.orderedBy,
          email: formData.email,
          billToId: formData.billTo,
          deliverToId: formData.deliverTo,
          notes: formData.notes,
        },
        items: formData.items,
      })

      console.log("Submit result:", result)
      toast.dismiss(toastId)

      if (result.success) {
        toast.success("Order submitted successfully!")
        router.push(`/forms/${formState.data.brandSlug}/success?orderId=${result.submissionId}`)
      } else {
        toast.error(result.message || "An unknown error occurred.")
      }
    } catch (error) {
      console.error("Submit error:", error)
      toast.dismiss(toastId)
      toast.error("Failed to submit order. Please try again.")
    }
  }

  // Loading state
  if (formState.isLoading) {
    console.log("Rendering loading state")
    return (
      <div className="space-y-8">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-1/3" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  // Error state
  if (formState.error || !formState.data) {
    console.log("Rendering error state:", formState.error)
    return (
      <div className="text-center p-8">
        <div className="text-red-500 text-lg font-semibold mb-2">Form Loading Error</div>
        <div className="text-gray-600 mb-4">{formState.error || "Could not load form data"}</div>
        <Button onClick={() => window.location.reload()}>Refresh Page</Button>
      </div>
    )
  }

  const { locationOptions, sections } = formState.data

  console.log("Rendering form with:", { locationOptions, sections })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Your Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <FormLabel>Your Email</FormLabel>
                    <FormControl>
                      <Input placeholder="you@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="billTo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bill To</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a billing location" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {locationOptions.map((opt, index) => {
                          console.log(`Rendering location option ${index}:`, opt)

                          // Triple-check that we're dealing with strings
                          const value = String(opt.value)
                          const label = String(opt.label)

                          console.log(`Rendering SelectItem with value="${value}" and label="${label}"`)

                          return (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a delivery location" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {locationOptions.map((opt, index) => {
                          console.log(`Rendering delivery location option ${index}:`, opt)

                          // Triple-check that we're dealing with strings
                          const value = String(opt.value)
                          const label = String(opt.label)

                          console.log(`Rendering SelectItem with value="${value}" and label="${label}"`)

                          return (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          )
                        })}
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
                  <FormLabel>Notes / Comments</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Any special instructions..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {sections.map((section, sectionIndex) => {
          console.log(`Rendering section ${sectionIndex}:`, section)

          return (
            <Card key={section.id}>
              <CardHeader>
                <CardTitle>{String(section.title)}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {section.items.map((item, itemIndex) => {
                  console.log(`Rendering item ${itemIndex} in section ${sectionIndex}:`, item)

                  return (
                    <React.Fragment key={item.id}>
                      <FormField
                        control={form.control}
                        name={`items.${item.id}`}
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex flex-col space-y-2">
                              <FormLabel className="font-semibold text-base">
                                {String(item.name)}
                                {item.is_required && <span className="text-red-500 ml-1">*</span>}
                              </FormLabel>
                              {item.description && <FormDescription>{String(item.description)}</FormDescription>}
                              <FormControl>
                                <>
                                  {item.field_type === "text" && (
                                    <Input {...field} value={field.value || ""} placeholder={item.placeholder || ""} />
                                  )}
                                  {item.field_type === "textarea" && (
                                    <Textarea
                                      {...field}
                                      value={field.value || ""}
                                      placeholder={item.placeholder || ""}
                                    />
                                  )}
                                  {item.field_type === "number" && (
                                    <Input
                                      type="number"
                                      {...field}
                                      value={field.value || ""}
                                      placeholder={item.placeholder || ""}
                                    />
                                  )}
                                  {item.field_type === "date" && (
                                    <Input type="date" {...field} value={field.value || ""} />
                                  )}
                                  {item.field_type === "checkbox" && (
                                    <div className="flex items-center space-x-2 pt-2">
                                      <Checkbox
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                        id={`items.${item.id}`}
                                      />
                                      <label
                                        htmlFor={`items.${item.id}`}
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                      >
                                        {item.placeholder || "Confirm"}
                                      </label>
                                    </div>
                                  )}
                                  {item.field_type === "select" && (
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder={item.placeholder || "Select an option"} />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        {item.options.map((opt, optIndex) => {
                                          console.log(`Rendering select option ${optIndex}:`, opt)

                                          const value = String(opt.value)
                                          const label = String(opt.label || opt.value)

                                          return (
                                            <SelectItem key={opt.id} value={value}>
                                              {label}
                                            </SelectItem>
                                          )
                                        })}
                                      </SelectContent>
                                    </Select>
                                  )}
                                  {item.field_type === "radio" && (
                                    <RadioGroup
                                      onValueChange={field.onChange}
                                      defaultValue={field.value}
                                      className="flex flex-col space-y-1 pt-2"
                                    >
                                      {item.options.map((opt, optIndex) => {
                                        console.log(`Rendering radio option ${optIndex}:`, opt)

                                        const value = String(opt.value)
                                        const label = String(opt.label || opt.value)

                                        return (
                                          <FormItem key={opt.id} className="flex items-center space-x-3 space-y-0">
                                            <FormControl>
                                              <RadioGroupItem value={value} />
                                            </FormControl>
                                            <FormLabel className="font-normal">{label}</FormLabel>
                                          </FormItem>
                                        )
                                      })}
                                    </RadioGroup>
                                  )}
                                </>
                              </FormControl>
                              <FormMessage />
                            </div>
                          </FormItem>
                        )}
                      />
                      {itemIndex < section.items.length - 1 && <Separator className="mt-6" />}
                    </React.Fragment>
                  )
                })}
              </CardContent>
            </Card>
          )
        })}

        <div className="flex justify-end">
          <Button type="submit" size="lg" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Submitting..." : "Submit Order"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
