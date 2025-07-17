"use client"

import React from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
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

import { submitOrder } from "./actions"
import type { ClientFormParams } from "@/lib/types"

interface ClientFormProps {
  formData: ClientFormParams
}

export const ClientForm = ({ formData }: ClientFormProps) => {
  const router = useRouter()

  // EXTREME SAFETY: Ensure formData is valid
  const safeFormData = {
    brandSlug: String(formData?.brandSlug || ""),
    brandName: String(formData?.brandName || ""),
    brandLogo: formData?.brandLogo ? String(formData.brandLogo) : null,
    locationOptions: Array.isArray(formData?.locationOptions) ? formData.locationOptions : [],
    sections: Array.isArray(formData?.sections) ? formData.sections : [],
  }

  const { brandSlug, locationOptions, sections } = safeFormData

  // Create form schema
  const formSchema = z.object({
    orderedBy: z.string().min(1, "Your name is required."),
    email: z.string().email("Please enter a valid email address."),
    billTo: z.string().min(1, "Please select a billing location."),
    deliverTo: z.string().min(1, "Please select a delivery location."),
    notes: z.string().optional(),
    items: z.object(
      sections
        .flatMap((section) => section?.items || [])
        .reduce(
          (acc, item) => {
            if (!item?.id) return acc

            let fieldSchema: z.ZodTypeAny
            switch (item.field_type) {
              case "checkbox":
                fieldSchema = item.is_required
                  ? z.literal(true, { errorMap: () => ({ message: "This box must be checked." }) })
                  : z.boolean().default(false)
                break
              case "number":
                fieldSchema = item.is_required
                  ? z.coerce.number({ required_error: "This field is required." }).min(0)
                  : z.coerce.number({ invalid_type_error: "Must be a number" }).optional().or(z.literal(""))
                break
              default:
                fieldSchema = item.is_required
                  ? z.string().min(1, { message: "This field is required." })
                  : z.string().optional()
            }
            acc[item.id] = fieldSchema
            return acc
          },
          {} as Record<string, z.ZodTypeAny>,
        ),
    ),
  })

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
        .flatMap((s) => s?.items || [])
        .reduce((acc, item) => {
          if (item?.id) {
            acc[item.id] = item.field_type === "checkbox" ? false : ""
          }
          return acc
        }, {} as any),
    },
  })

  async function onSubmit(data: FormValues) {
    const toastId = toast.loading("Submitting your order, please wait...")

    try {
      const result = await submitOrder({
        brandSlug,
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
        toast.error(result.message || "An unknown error occurred.")
      }
    } catch (error) {
      toast.dismiss(toastId)
      toast.error("Failed to submit order. Please try again.")
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
                        {locationOptions.map((option) => {
                          // TRIPLE CHECK: Ensure we're only passing strings
                          const safeValue = String(option?.value || "")
                          const safeLabel = String(option?.label || "Unknown Location")

                          return (
                            <SelectItem key={safeValue} value={safeValue}>
                              {safeLabel}
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
                        {locationOptions.map((option) => {
                          // TRIPLE CHECK: Ensure we're only passing strings
                          const safeValue = String(option?.value || "")
                          const safeLabel = String(option?.label || "Unknown Location")

                          return (
                            <SelectItem key={safeValue} value={safeValue}>
                              {safeLabel}
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

        {sections.map((section) => {
          if (!section?.id) return null

          return (
            <Card key={String(section.id)}>
              <CardHeader>
                <CardTitle>{String(section?.title || "Untitled Section")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {(section?.items || []).map((item, index) => {
                  if (!item?.id) return null

                  return (
                    <React.Fragment key={String(item.id)}>
                      <FormField
                        control={form.control}
                        name={`items.${String(item.id)}`}
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex flex-col space-y-2">
                              <FormLabel className="font-semibold text-base">
                                {String(item?.name || "Untitled Item")}
                                {item?.is_required && <span className="text-red-500 ml-1">*</span>}
                              </FormLabel>
                              {item?.description && <FormDescription>{String(item.description)}</FormDescription>}
                              <FormControl>
                                <>
                                  {item?.field_type === "text" && (
                                    <Input
                                      {...field}
                                      value={String(field.value || "")}
                                      placeholder={String(item?.placeholder || "")}
                                    />
                                  )}
                                  {item?.field_type === "textarea" && (
                                    <Textarea
                                      {...field}
                                      value={String(field.value || "")}
                                      placeholder={String(item?.placeholder || "")}
                                    />
                                  )}
                                  {item?.field_type === "number" && (
                                    <Input
                                      type="number"
                                      {...field}
                                      value={String(field.value || "")}
                                      placeholder={String(item?.placeholder || "")}
                                    />
                                  )}
                                  {item?.field_type === "date" && (
                                    <Input type="date" {...field} value={String(field.value || "")} />
                                  )}
                                  {item?.field_type === "checkbox" && (
                                    <div className="flex items-center space-x-2 pt-2">
                                      <Checkbox
                                        checked={Boolean(field.value)}
                                        onCheckedChange={field.onChange}
                                        id={`items.${String(item.id)}`}
                                      />
                                      <label
                                        htmlFor={`items.${String(item.id)}`}
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                      >
                                        {String(item?.placeholder || "Confirm")}
                                      </label>
                                    </div>
                                  )}
                                  {item?.field_type === "select" && (
                                    <Select onValueChange={field.onChange} defaultValue={String(field.value || "")}>
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder={String(item?.placeholder || "Select an option")} />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        {(item?.options || []).map((opt) => {
                                          if (!opt?.id) return null

                                          const safeValue = String(opt?.value || "")
                                          const safeLabel = String(opt?.label || opt?.value || "Unknown Option")

                                          return (
                                            <SelectItem key={String(opt.id)} value={safeValue}>
                                              {safeLabel}
                                            </SelectItem>
                                          )
                                        })}
                                      </SelectContent>
                                    </Select>
                                  )}
                                  {item?.field_type === "radio" && (
                                    <RadioGroup
                                      onValueChange={field.onChange}
                                      defaultValue={String(field.value || "")}
                                      className="flex flex-col space-y-1 pt-2"
                                    >
                                      {(item?.options || []).map((opt) => {
                                        if (!opt?.id) return null

                                        const safeValue = String(opt?.value || "")
                                        const safeLabel = String(opt?.label || opt?.value || "Unknown Option")

                                        return (
                                          <FormItem
                                            key={String(opt.id)}
                                            className="flex items-center space-x-3 space-y-0"
                                          >
                                            <FormControl>
                                              <RadioGroupItem value={safeValue} />
                                            </FormControl>
                                            <FormLabel className="font-normal">{safeLabel}</FormLabel>
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
                      {index < (section?.items?.length || 0) - 1 && <Separator className="mt-6" />}
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
