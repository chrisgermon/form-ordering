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

// This is the named export that the build process requires
export const ClientForm = ({ data }: { data: string }) => {
  const router = useRouter()
  const [formState, setFormState] = React.useState<{
    isLoading: boolean
    data: ClientFormParams | null
  }>({ isLoading: true, data: null })

  // Safely parse data in a useEffect hook to prevent hydration errors
  React.useEffect(() => {
    try {
      const parsedData = JSON.parse(data)
      setFormState({ isLoading: false, data: parsedData })
    } catch (error) {
      console.error("Fatal Error: Could not parse form data from server.", error)
      toast.error("A critical error occurred. Please refresh the page.")
      setFormState({ isLoading: false, data: null })
    }
  }, [data])

  const formSchema = React.useMemo(() => {
    if (!formState.data) return z.object({}) // Return a base schema if data is not ready

    const itemSchema = z.object(
      formState.data.sections
        .flatMap((section) => section.items)
        .reduce(
          (acc, item) => {
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
    return z.object({
      orderedBy: z.string().min(1, "Your name is required."),
      email: z.string().email("Please enter a valid email address."),
      billTo: z.string().min(1, "Please select a billing location."),
      deliverTo: z.string().min(1, "Please select a delivery location."),
      notes: z.string().optional(),
      items: itemSchema,
    })
  }, [formState.data])

  type FormValues = z.infer<typeof formSchema>

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema as any),
    // Default values are set in the useEffect below to ensure they are populated correctly
  })

  // Reset the form with default values once the data is loaded
  React.useEffect(() => {
    if (formState.data) {
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
      form.reset(defaultValues)
    }
  }, [formState.data, form])

  async function onSubmit(formData: FormValues) {
    if (!formState.data) return

    const toastId = toast.loading("Submitting your order, please wait...")
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
    toast.dismiss(toastId)
    if (result.success) {
      toast.success("Order submitted successfully!")
      router.push(`/forms/${formState.data.brandSlug}/success?orderId=${result.submissionId}`)
    } else {
      toast.error(result.message || "An unknown error occurred.")
    }
  }

  // Display a loading skeleton while parsing data
  if (formState.isLoading) {
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
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-6">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!formState.data) {
    return <div className="text-center text-red-500">Could not load form. Please try refreshing the page.</div>
  }

  const { locationOptions, sections } = formState.data

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
                        {locationOptions.map((opt) => (
                          <SelectItem key={String(opt.value)} value={String(opt.value)}>
                            {String(opt.label)}
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
                        {locationOptions.map((opt) => (
                          <SelectItem key={String(opt.value)} value={String(opt.value)}>
                            {String(opt.label)}
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

        {sections.map((section) => (
          <Card key={section.id}>
            <CardHeader>
              <CardTitle>{String(section.title)}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {section.items.map((item, index) => (
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
                                <Textarea {...field} value={field.value || ""} placeholder={item.placeholder || ""} />
                              )}
                              {item.field_type === "number" && (
                                <Input
                                  type="number"
                                  {...field}
                                  value={field.value || ""}
                                  placeholder={item.placeholder || ""}
                                />
                              )}
                              {item.field_type === "date" && <Input type="date" {...field} value={field.value || ""} />}
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
                                    {item.options.map((opt) => (
                                      <SelectItem key={String(opt.id)} value={String(opt.value)}>
                                        {String(opt.label || opt.value)}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )}
                              {item.field_type === "radio" && (
                                <RadioGroup
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                  className="flex flex-col space-y-1 pt-2"
                                >
                                  {item.options.map((opt) => (
                                    <FormItem key={String(opt.id)} className="flex items-center space-x-3 space-y-0">
                                      <FormControl>
                                        <RadioGroupItem value={String(opt.value)} />
                                      </FormControl>
                                      <FormLabel className="font-normal">{String(opt.label || opt.value)}</FormLabel>
                                    </FormItem>
                                  ))}
                                </RadioGroup>
                              )}
                            </>
                          </FormControl>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />
                  {index < section.items.length - 1 && <Separator className="mt-6" />}
                </React.Fragment>
              ))}
            </CardContent>
          </Card>
        ))}

        <div className="flex justify-end">
          <Button type="submit" size="lg" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Submitting..." : "Submit Order"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
