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
import type { SafeFormData } from "@/lib/types"

interface ClientFormProps {
  formData: SafeFormData
}

export function ClientForm({ formData }: ClientFormProps) {
  console.log("=== CLIENT FORM RENDER ===")
  console.log("Form data:", formData)

  const [orderInfo, setOrderInfo] = useState({
    orderedBy: "",
    email: "",
    billToId: "",
    deliverToId: "",
    notes: "",
  })

  const [items, setItems] = useState<Record<string, string | number | boolean>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleOrderInfoChange = (field: string, value: string) => {
    setOrderInfo((prev) => ({ ...prev, [field]: value }))
  }

  const handleItemChange = (itemId: string, value: string | number | boolean) => {
    setItems((prev) => ({ ...prev, [itemId]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const result = await submitOrder({
        brandSlug: formData.brandSlug,
        orderInfo,
        items,
      })

      if (result.success) {
        window.location.href = `/forms/${formData.brandSlug}/success?orderId=${result.submissionId}`
      } else {
        setError(result.error || "An error occurred")
      }
    } catch (err) {
      console.error("Submit error:", err)
      setError("An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderFormItem = (item: any) => {
    const itemId = String(item.id)
    const itemName = String(item.name)
    const itemCode = item.code ? String(item.code) : null
    const fieldType = String(item.fieldType)
    const placeholder = item.placeholder ? String(item.placeholder) : ""
    const isRequired = Boolean(item.isRequired)

    switch (fieldType) {
      case "number":
        return (
          <div key={itemId} className="space-y-2">
            <Label htmlFor={itemId}>
              {itemName}
              {isRequired && <span className="text-red-500 ml-1">*</span>}
            </Label>
            {itemCode && <p className="text-sm text-gray-500">Code: {itemCode}</p>}
            <Input
              id={itemId}
              type="number"
              min="0"
              placeholder={placeholder}
              required={isRequired}
              onChange={(e) => handleItemChange(itemId, Number.parseInt(e.target.value) || 0)}
            />
          </div>
        )

      case "textarea":
        return (
          <div key={itemId} className="space-y-2">
            <Label htmlFor={itemId}>
              {itemName}
              {isRequired && <span className="text-red-500 ml-1">*</span>}
            </Label>
            {itemCode && <p className="text-sm text-gray-500">Code: {itemCode}</p>}
            <Textarea
              id={itemId}
              placeholder={placeholder}
              required={isRequired}
              onChange={(e) => handleItemChange(itemId, e.target.value)}
            />
          </div>
        )

      case "checkbox":
        return (
          <div key={itemId} className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox id={itemId} onCheckedChange={(checked) => handleItemChange(itemId, Boolean(checked))} />
              <Label htmlFor={itemId}>
                {itemName}
                {isRequired && <span className="text-red-500 ml-1">*</span>}
              </Label>
            </div>
            {itemCode && <p className="text-sm text-gray-500">Code: {itemCode}</p>}
          </div>
        )

      default:
        return (
          <div key={itemId} className="space-y-2">
            <Label htmlFor={itemId}>
              {itemName}
              {isRequired && <span className="text-red-500 ml-1">*</span>}
            </Label>
            {itemCode && <p className="text-sm text-gray-500">Code: {itemCode}</p>}
            <Input
              id={itemId}
              placeholder={placeholder}
              required={isRequired}
              onChange={(e) => handleItemChange(itemId, e.target.value)}
            />
          </div>
        )
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8 text-center">
        {formData.brandLogo && (
          <img
            src={formData.brandLogo || "/placeholder.svg"}
            alt={`${formData.brandName} logo`}
            className="h-16 mx-auto mb-4"
          />
        )}
        <h1 className="text-3xl font-bold">{formData.brandName} Order Form</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
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
                    {formData.locationOptions.map((location) => {
                      const value = String(location.value)
                      const label = String(location.label)
                      console.log("Rendering bill to option:", { value, label })
                      return (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      )
                    })}
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
                    {formData.locationOptions.map((location) => {
                      const value = String(location.value)
                      const label = String(location.label)
                      console.log("Rendering deliver to option:", { value, label })
                      return (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      )
                    })}
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

        {formData.sections.map((section) => {
          const sectionId = String(section.id)
          const sectionTitle = String(section.title)
          console.log("Rendering section:", { sectionId, sectionTitle })

          return (
            <Card key={sectionId}>
              <CardHeader>
                <CardTitle>{sectionTitle}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">{section.items.map((item) => renderFormItem(item))}</CardContent>
            </Card>
          )
        })}

        {error && <div className="text-red-600 bg-red-50 p-4 rounded-lg text-center">{error}</div>}

        <div className="flex justify-center">
          <Button type="submit" size="lg" disabled={isSubmitting}>
            {isSubmitting ? "Submitting Order..." : "Submit Order"}
          </Button>
        </div>
      </form>
    </div>
  )
}
