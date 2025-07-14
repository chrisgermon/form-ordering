"use client"

import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "sonner"
import { resolveAssetUrl } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import type { BrandData, Item } from "@/lib/types"

const createOrderSchema = (items: Item[]) => {
  const itemSchemas = items.reduce(
    (acc, item) => {
      acc[item.code] = z.object({
        quantity: z.string(),
        customQuantity: z.string().optional(),
      })
      return acc
    },
    {} as Record<string, z.ZodObject<any>>,
  )

  return z
    .object({
      orderedBy: z.string().min(1, "Your name is required."),
      email: z.string().email("A valid email is required."),
      billToId: z.string().min(1, "Please select a billing location."),
      deliverToId: z.string().min(1, "Please select a delivery location."),
      notes: z.string().optional(),
      items: z.object(itemSchemas),
    })
    .refine(
      (data) => {
        const hasItems = Object.values(data.items).some(
          (item) => item.quantity && item.quantity !== "0" && item.quantity !== "",
        )
        return hasItems
      },
      {
        message: "You must order at least one item.",
        path: ["items"],
      },
    )
}

export function BrandFacingForm({ brandData }: { brandData: BrandData }) {
  const allItems = brandData.sections.flatMap((s) => s.items)
  const validationSchema = createOrderSchema(allItems)

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<z.infer<typeof validationSchema>>({
    resolver: zodResolver(validationSchema),
    defaultValues: {
      orderedBy: "",
      email: "",
      notes: "",
      items: allItems.reduce((acc, item) => {
        acc[item.code] = { quantity: "0", customQuantity: "" }
        return acc
      }, {} as any),
    },
  })

  const watchedItems = watch("items")

  if (!brandData || !brandData.sections) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-lg text-muted-foreground">Loading form...</p>
      </div>
    )
  }

  const onSubmit = async (data: z.infer<typeof validationSchema>) => {
    const orderedItems = Object.entries(data.items)
      .filter(([, itemData]) => itemData.quantity && itemData.quantity !== "0")
      .reduce(
        (acc, [code, itemData]) => {
          const itemInfo = allItems.find((i) => i.code === code)
          if (itemInfo) {
            acc[code] = {
              code: itemInfo.code,
              name: itemInfo.name,
              ...itemData,
            }
          }
          return acc
        },
        {} as Record<string, any>,
      )

    const payload = {
      brandSlug: brandData.slug,
      orderInfo: {
        orderedBy: data.orderedBy,
        email: data.email,
        billToId: data.billToId,
        deliverToId: data.deliverToId,
        notes: data.notes,
      },
      items: orderedItems,
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
            <CardContent className="space-y-4">
              {section.items.map((item) => (
                <div key={item.id} className="grid grid-cols-3 items-center gap-4 border-t pt-4">
                  <div className="col-span-3 sm:col-span-2">
                    <Label htmlFor={`items.${item.code}.quantity`} className="font-semibold">
                      {item.name}
                    </Label>
                    <p className="text-sm text-muted-foreground">Code: {item.code}</p>
                  </div>
                  <div className="col-span-3 sm:col-span-1 grid grid-cols-2 gap-2">
                    <Controller
                      name={`items.${item.code}.quantity`}
                      control={control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Qty" />
                          </SelectTrigger>
                          <SelectContent>
                            {[...Array(11).keys()].map((i) => (
                              <SelectItem key={i} value={String(i)}>
                                {i}
                              </SelectItem>
                            ))}
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {watchedItems?.[item.code]?.quantity === "other" && (
                      <Controller
                        name={`items.${item.code}.customQuantity`}
                        control={control}
                        render={({ field }) => <Input {...field} placeholder="Custom" type="number" />}
                      />
                    )}
                  </div>
                </div>
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

        {errors.items && <p className="text-sm font-medium text-destructive text-center">{errors.items.message}</p>}

        <div className="flex justify-end">
          <Button type="submit" size="lg" disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit Order"}
          </Button>
        </div>
      </form>
    </div>
  )
}
