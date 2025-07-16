"use client"

import React, { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Terminal } from "lucide-react"

import { submitOrder } from "./actions"
import type { SanitizedBrandData } from "@/lib/types"

// Loading skeleton component
function FormSkeleton() {
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
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-1/2" />
        </CardHeader>
        <CardContent className="space-y-6">
          <Skeleton className="h-12 w-full" />
          <Separator />
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    </div>
  )
}

export default function BrandFormPage() {
  const params = useParams()
  const router = useRouter()
  const brandSlug = params.brandSlug as string

  const [formData, setFormData] = useState<SanitizedBrandData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!brandSlug) return

    async function fetchData() {
      try {
        setIsLoading(true)
        setError(null)
        const response = await fetch(`/api/forms/${brandSlug}`)
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || `Failed to fetch form data. Status: ${response.status}`)
        }
        const data: SanitizedBrandData = await response.json()
        setFormData(data)
      } catch (e) {
        console.error(e)
        setError(e instanceof Error ? e.message : "An unknown error occurred.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [brandSlug])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm sticky top-0 z-10">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <Skeleton className="h-10 w-[160px]" />
            <Skeleton className="h-8 w-1/3" />
            <div className="w-[160px]" />
          </div>
        </header>
        <main className="container mx-auto p-4 md:p-8">
          <FormSkeleton />
        </main>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-lg">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Error Loading Form</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!formData) {
    return null // Should be covered by loading/error states
  }

  return <OrderForm brandData={formData} />
}

// The actual form component, now receiving sanitized data
function OrderForm({ brandData }: { brandData: SanitizedBrandData }) {
  const router = useRouter()
  const { slug: brandSlug, locationOptions, sections, name: brandName, logo } = brandData

  const formSchema = React.useMemo(() => {
    const itemSchema = z.object(
      sections
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
  }, [sections])

  type FormValues = z.infer<typeof formSchema>

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      orderedBy: "",
      email: "",
      billTo: "",
      deliverTo: "",
      notes: "",
      items: sections
        .flatMap((s) => s.items)
        .reduce((acc, item) => {
          acc[item.id] = item.field_type === "checkbox" ? false : ""
          return acc
        }, {} as any),
    },
  })

  async function onSubmit(data: FormValues) {
    const toastId = toast.loading("Submitting your order, please wait...")
    const result = await submitOrder({
      brandSlug: brandSlug,
      orderInfo: {
        orderedBy: data.orderedBy,
        email: data.email,
        billToId: data.billTo,
        deliverToId: data.deliverTo,
        notes: data.notes,
      },
      items: data.items,
    })
    toast.dismiss(toastId)
    if (result.success) {
      toast.success("Order submitted successfully!")
      router.push(`/forms/${brandSlug}/success?orderId=${result.submissionId}`)
    } else {
      const errorMessage = typeof result.message === "string" ? result.message : "An unknown error occurred."
      toast.error(errorMessage)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4 w-[160px]">
            {logo && (
              <Image
                src={logo || "/placeholder.svg"}
                alt={`${brandName} Logo`}
                width={160}
                height={40}
                className="object-contain h-10 w-auto"
                priority
              />
            )}
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-800 text-center flex-1">{brandName} Order Form</h1>
          <div className="w-[160px]" />
        </div>
      </header>
      <main className="container mx-auto p-4 md:p-8">
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
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
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
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
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
                  <CardTitle>{section.title}</CardTitle>
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
                                {item.name}
                                {item.is_required && <span className="text-red-500 ml-1">*</span>}
                              </FormLabel>
                              {item.description && <FormDescription>{item.description}</FormDescription>}
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
                                        {item.options.map((opt) => (
                                          <SelectItem key={opt.id} value={opt.value}>
                                            {opt.label || opt.value}
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
                                        <FormItem key={opt.id} className="flex items-center space-x-3 space-y-0">
                                          <FormControl>
                                            <RadioGroupItem value={opt.value} />
                                          </FormControl>
                                          <FormLabel className="font-normal">{opt.label || opt.value}</FormLabel>
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
      </main>
      <footer className="py-4 text-center text-sm text-gray-500">
        <p>
          &copy; {new Date().getFullYear()} {brandName}. All rights reserved.
        </p>
      </footer>
    </div>
  )
}
