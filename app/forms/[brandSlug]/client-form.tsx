"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { submitOrder } from "./actions"
import type { ClientFormData } from "@/lib/types"

interface ClientFormProps {
  formData: ClientFormData
}

export function ClientForm({ formData }: ClientFormProps) {
  console.log("=== CLIENT FORM RENDER ===")
  console.log("Form data received:", formData)

  const [orderInfo, setOrderInfo] = useState({
    orderedBy: "",
    email: "",
    billToId: "",
    deliverToId: "",
    notes: "",
  })

  const [items, setItems] = useState<Record<string, string | number | boolean>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleOrderInfoChange = (field: string, value: string) => {
    console.log("Order info change:", field, value)
    setOrderInfo((prev) => ({ ...prev, [field]: value }))
  }

  const handleItemChange = (itemId: string, value: string | number | boolean) => {
    console.log("Item change:", itemId, value)
    setItems((prev) => ({ ...prev, [itemId]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("=== FORM SUBMIT ===")
    console.log("Order info:", orderInfo)
    console.log("Items:", items)

    setIsSubmitting(true)

    try {
      const result = await submitOrder({
        brandSlug: formData.brand.slug,
        orderInfo,
        items,
      })

      if (result.success) {
        console.log("Order submitted successfully:", result)
        // Redirect to success page
        window.location.href = `/forms/${formData.brand.slug}/success`
      } else {
        console.error("Order submission failed:", result.error)
        alert(`Error: ${result.error}`)
      }
    } catch (error) {
      console.error("Submit error:", error)
      alert("An error occurred while submitting the order")
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderFormItem = (item: any) => {
    console.log("Rendering form item:", item)

    switch (item.field_type) {
      case "text":
        return (
          <div key={item.id} className="space-y-2">
            <Label htmlFor={item.id}>
              {item.name}
              {item.is_required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={item.id}
              placeholder={item.placeholder || ""}
              required={item.is_required}
              onChange={(e) => handleItemChange(item.id, e.target.value)}
            />
            {item.description && <p className="text-sm text-gray-600">{item.description}</p>}
          </div>
        )

      case "number":
        return (
          <div key={item.id} className="space-y-2">
            <Label htmlFor={item.id}>
              {item.name}
              {item.is_required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={item.id}
              type="number"
              placeholder={item.placeholder || "0"}
              required={item.is_required}
              onChange={(e) => handleItemChange(item.id, Number.parseInt(e.target.value) || 0)}
            />
            {item.description && <p className="text-sm text-gray-600">{item.description}</p>}
          </div>
        )

      case "textarea":
        return (
          <div key={item.id} className="space-y-2">
            <Label htmlFor={item.id}>
              {item.name}
              {item.is_required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Textarea
              id={item.id}
              placeholder={item.placeholder || ""}
              required={item.is_required}
              onChange={(e) => handleItemChange(item.id, e.target.value)}
            />
            {item.description && <p className="text-sm text-gray-600">{item.description}</p>}
          </div>
        )

      case "checkbox":
        return (
          <div key={item.id} className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox id={item.id} onCheckedChange={(checked) => handleItemChange(item.id, checked)} />
              <Label htmlFor={item.id}>
                {item.name}
                {item.is_required && <span className="text-red-500 ml-1">*</span>}
              </Label>
            </div>
            {item.description && <p className="text-sm text-gray-600">{item.description}</p>}
          </div>
        )

      default:
        return (
          <div key={item.id} className="space-y-2">
            <Label htmlFor={item.id}>
              {item.name}
              {item.is_required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={item.id}
              placeholder={item.placeholder || ""}
              required={item.is_required}
              onChange={(e) => handleItemChange(item.id, e.target.value)}
            />
            {item.description && <p className="text-sm text-gray-600">{item.description}</p>}
          </div>
        )
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8 text-center">
        {formData.brand.logo && (
          <img
            src={formData.brand.logo || "/placeholder.svg"}
            alt={`${formData.brand.name} logo`}
            className="h-16 mx-auto mb-4"
          />
        )}
        <h1 className="text-3xl font-bold">{formData.brand.name} Order Form</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Order Information */}
        <Card>
          <CardHeader>
            <CardTitle>Order Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="orderedBy">
                  Ordered By <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="orderedBy"
                  required
                  value={orderInfo.orderedBy}
                  onChange={(e) => handleOrderInfoChange("orderedBy", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">
                  Email <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={orderInfo.email}
                  onChange={(e) => handleOrderInfoChange("email", e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="billTo">
                  Bill To <span className="text-red-500">*</span>
                </Label>
                <Select
                  required
                  value={orderInfo.billToId}
                  onValueChange={(value) => handleOrderInfoChange("billToId", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select billing location" />
                  </SelectTrigger>
                  <SelectContent>
                    {formData.locationOptions.map((location) => (
                      <SelectItem key={location.value} value={location.value}>
                        {location.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="deliverTo">
                  Deliver To <span className="text-red-500">*</span>
                </Label>
                <Select
                  required
                  value={orderInfo.deliverToId}
                  onValueChange={(value) => handleOrderInfoChange("deliverToId", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select delivery location" />
                  </SelectTrigger>
                  <SelectContent>
                    {formData.locationOptions.map((location) => (
                      <SelectItem key={location.value} value={location.value}>
                        {location.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Additional notes or special instructions"
                value={orderInfo.notes}
                onChange={(e) => handleOrderInfoChange("notes", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Product Sections */}
        {formData.sections.map((section) => (
          <Card key={section.id}>
            <CardHeader>
              <CardTitle>{section.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">{section.items.map((item) => renderFormItem(item))}</CardContent>
          </Card>
        ))}

        {/* Submit Button */}
        <div className="flex justify-center">
          <Button type="submit" size="lg" disabled={isSubmitting}>
            {isSubmitting ? "Submitting Order..." : "Submit Order"}
          </Button>
        </div>
      </form>
    </div>
  )
}
