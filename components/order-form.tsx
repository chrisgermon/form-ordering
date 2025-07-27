"use client"

import { useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import type { Brand, ProductSection, ProductItem } from "@/lib/types"

type OrderFormProps = {
  brand: Brand & {
    product_sections: (ProductSection & {
      product_items: ProductItem[]
    })[]
  }
}

export function OrderForm({ brand }: OrderFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { register, handleSubmit, control, watch, setValue } = useForm()
  const watchBillTo = watch("bill_to", "")

  const onSubmit = async (data: any) => {
    setIsSubmitting(true)

    const submissionData = {
      ...data,
      brand_id: brand.id,
    }

    try {
      const response = await fetch("/api/submit-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submissionData),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to process order.")
      }

      toast.success("Order submitted successfully!", {
        description: "Your PDF order form has been generated and sent.",
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred."
      console.error("Submission Error:", error)
      toast.error("Error submitting order.", {
        description: errorMessage,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleBillToChange = (value: string) => {
    setValue("bill_to", value)
    if (value === "other") {
      setTimeout(() => {
        const otherInput = document.getElementById("bill_to_other")
        otherInput?.focus()
      }, 0)
    }
  }

  const sections = brand.product_sections || []
  const clinics = brand.clinics || []

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">{brand.name} Order Form</h1>
        {brand.logo && (
          <img src={brand.logo || "/placeholder.svg"} alt={`${brand.name} Logo`} className="h-16 object-contain" />
        )}
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Contact and Delivery Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ordered_by">Your Name</Label>
                <Input id="ordered_by" {...register("ordered_by", { required: true })} />
              </div>
              <div>
                <Label htmlFor="email">Your Email</Label>
                <Input id="email" type="email" {...register("email", { required: true })} />
              </div>
            </div>
            <div>
              <Label htmlFor="bill_to">Bill To</Label>
              <Select onValueChange={handleBillToChange} defaultValue="">
                <SelectTrigger>
                  <SelectValue placeholder="Select a billing address" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {clinics.map((clinic, index) => (
                      <SelectItem key={index} value={`${clinic.name}, ${clinic.address}`}>
                        {clinic.name}
                      </SelectItem>
                    ))}
                    <SelectItem value="other">Other (please specify)</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
              {watchBillTo === "other" && (
                <Textarea
                  id="bill_to_other"
                  className="mt-2"
                  placeholder="Enter full billing name and address"
                  {...register("bill_to_other_address", { required: true })}
                />
              )}
            </div>
            <div>
              <Label htmlFor="deliver_to">Deliver To</Label>
              <Select onValueChange={(value) => setValue("deliver_to", value)} defaultValue="">
                <SelectTrigger>
                  <SelectValue placeholder="Select a delivery address" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="Same as billing address">Same as billing address</SelectItem>
                    {clinics.map((clinic, index) => (
                      <SelectItem key={index} value={`${clinic.name}, ${clinic.address}`}>
                        {clinic.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {sections.map((section, sectionIndex) => (
          <Card key={section.id}>
            <CardHeader>
              <CardTitle>{section.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {(section.product_items || []).map((item, itemIndex) => (
                <div key={item.id} className="p-4 border rounded-lg">
                  <h4 className="font-semibold text-lg">{item.name}</h4>
                  {item.description && <p className="text-sm text-gray-600 mb-2">{item.description}</p>}
                  <div className="flex items-center space-x-4">
                    <Label>Quantity:</Label>
                    {(Array.isArray(item.quantities) ? item.quantities : []).map((qty, qtyIndex) => (
                      <div key={qtyIndex} className="flex items-center space-x-2">
                        <Controller
                          name={`items.${item.code}.quantity`}
                          control={control}
                          render={({ field }) => (
                            <Checkbox
                              id={`${item.id}-qty-${qtyIndex}`}
                              checked={field.value === qty}
                              onCheckedChange={(checked) => field.onChange(checked ? qty : "")}
                            />
                          )}
                        />
                        <Label htmlFor={`${item.id}-qty-${qtyIndex}`}>{qty}</Label>
                      </div>
                    ))}
                  </div>
                  {item.sample_link && (
                    <a
                      href={item.sample_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline mt-2 inline-block"
                    >
                      CHECK HERE for sample
                    </a>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        ))}

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit Order"}
          </Button>
        </div>
      </form>
    </div>
  )
}
