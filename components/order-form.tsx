"use client"

import { useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import type { Brand, ProductSection, Item } from "@/lib/types"
import Image from "next/image"

type FormValues = {
  orderedBy: string
  email: string
  phone?: string
  billTo: string
  deliverTo: string
  items?: Record<
    string,
    {
      id: string
      name: string
      quantity: string
      customQuantity?: string
    }
  >
  specialInstructions?: string
}

interface OrderFormProps {
  brand: Brand & {
    product_sections: (ProductSection & {
      product_items: Item[]
    })[]
  }
}

export default function OrderForm({ brand }: OrderFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      orderedBy: "",
      email: "",
      phone: "",
      billTo: "",
      deliverTo: "",
      items: {},
      specialInstructions: "",
    },
  })

  const watchedItems = watch("items")

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true)
    const toastId = toast.loading("Submitting your order...")

    const itemsToSubmit = Object.fromEntries(
      Object.entries(data.items || {}).filter(
        ([, item]) => (item.quantity && item.quantity !== "0") || (item.quantity === "other" && item.customQuantity),
      ),
    )

    const payload = {
      ...data,
      items: itemsToSubmit,
      brandId: brand.id,
      brandName: brand.name,
      brandEmail: brand.email,
    }

    try {
      const response = await fetch("/api/submit-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.details || result.error || "An unknown error occurred.")
      }

      toast.success("Order submitted successfully!", {
        id: toastId,
        description: "You will receive a confirmation email shortly.",
        action: {
          label: "View PDF",
          onClick: () => window.open(result.pdfUrl, "_blank"),
        },
      })
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

  const validClinics =
    brand.clinics?.filter((c) => {
      if (typeof c === "string") return c.trim() !== ""
      if (typeof c === "object" && c !== null) return c.name && c.name.trim() !== ""
      return false
    }) || []

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
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="orderedBy">Your Name</Label>
                <Input id="orderedBy" {...register("orderedBy", { required: "Your name is required" })} />
                {errors.orderedBy && <p className="text-red-500 text-sm">{errors.orderedBy.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Your Email</Label>
                <Input
                  id="email"
                  type="email"
                  {...register("email", {
                    required: "Email is required",
                    pattern: {
                      value: /^\S+@\S+$/i,
                      message: "Invalid email address",
                    },
                  })}
                />
                {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number (Optional)</Label>
                <Input id="phone" type="tel" {...register("phone")} />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="billTo">Bill To</Label>
                {validClinics.length > 0 ? (
                  <Controller
                    name="billTo"
                    control={control}
                    rules={{ required: "Billing address is required" }}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a clinic or enter address" />
                        </SelectTrigger>
                        <SelectContent>
                          {validClinics.map((clinic, index) => {
                            const clinicName = typeof clinic === "string" ? clinic : clinic.name
                            const clinicValue =
                              typeof clinic === "string" ? clinic : `${clinic.name}\n${clinic.address}`
                            return (
                              <SelectItem key={index} value={clinicValue}>
                                {clinicName}
                              </SelectItem>
                            )
                          })}
                        </SelectContent>
                      </Select>
                    )}
                  />
                ) : (
                  <Textarea
                    id="billTo"
                    {...register("billTo", { required: "Billing address is required" })}
                    placeholder="Enter billing address"
                  />
                )}
                {errors.billTo && <p className="text-red-500 text-sm">{errors.billTo.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="deliverTo">Deliver To</Label>
                {validClinics.length > 0 ? (
                  <Controller
                    name="deliverTo"
                    control={control}
                    rules={{ required: "Delivery address is required" }}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a clinic or enter address" />
                        </SelectTrigger>
                        <SelectContent>
                          {validClinics.map((clinic, index) => {
                            const clinicName = typeof clinic === "string" ? clinic : clinic.name
                            const clinicValue =
                              typeof clinic === "string" ? clinic : `${clinic.name}\n${clinic.address}`
                            return (
                              <SelectItem key={index} value={clinicValue}>
                                {clinicName}
                              </SelectItem>
                            )
                          })}
                        </SelectContent>
                      </Select>
                    )}
                  />
                ) : (
                  <Textarea
                    id="deliverTo"
                    {...register("deliverTo", { required: "Delivery address is required" })}
                    placeholder="Enter delivery address"
                  />
                )}
                {errors.deliverTo && <p className="text-red-500 text-sm">{errors.deliverTo.message}</p>}
              </div>
            </div>

            <div className="space-y-6">
              {brand.product_sections.map((section) => (
                <div key={section.id}>
                  <h3 className="text-xl font-semibold mb-4 border-b pb-2">{section.title}</h3>
                  <div className="space-y-4">
                    {section.product_items.map((item) => {
                      const itemKey = `items.${item.id}`
                      const watchedQuantity = watchedItems?.[item.id]?.quantity

                      return (
                        <div key={item.id} className="grid md:grid-cols-3 gap-4 items-center">
                          <div className="md:col-span-2">
                            <Label htmlFor={itemKey}>{item.name}</Label>
                            <p className="text-sm text-muted-foreground">{item.description}</p>
                            {item.sample_link && (
                              <a
                                href={item.sample_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:underline"
                              >
                                View Sample
                              </a>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Controller
                              name={`${itemKey}.quantity` as const}
                              control={control}
                              render={({ field }) => (
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select quantity" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="0">0</SelectItem>
                                    {item.quantities.map((q) => (
                                      <SelectItem key={q} value={String(q)}>
                                        {q}
                                      </SelectItem>
                                    ))}
                                    <SelectItem value="other">Other</SelectItem>
                                  </SelectContent>
                                </Select>
                              )}
                            />
                            {watchedQuantity === "other" && (
                              <Input
                                type="number"
                                placeholder="Qty"
                                {...register(`${itemKey}.customQuantity` as const)}
                                className="w-24"
                              />
                            )}
                            <input type="hidden" {...register(`${itemKey}.id` as const)} value={item.id} />
                            <input type="hidden" {...register(`${itemKey}.name` as const)} value={item.name} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <Label htmlFor="specialInstructions">Special Instructions</Label>
              <Textarea
                id="specialInstructions"
                {...register("specialInstructions")}
                placeholder="Any special requests or notes for your order..."
              />
            </div>

            <CardFooter className="p-0 pt-6">
              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? "Submitting..." : "Submit Order"}
              </Button>
            </CardFooter>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
