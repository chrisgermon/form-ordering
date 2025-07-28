"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import type { Brand } from "@/lib/types"

interface OrderFormProps {
  brandData: Brand
}

export default function OrderForm({ brandData }: OrderFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    orderedBy: "",
    email: "",
    billTo: "",
    deliverTo: "",
    date: "",
    items: {} as Record<string, any>,
  })

  if (!brandData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Loading...</h2>
          <p className="text-gray-600">Please wait while we load the form.</p>
        </div>
      </div>
    )
  }

  const clinics = brandData.clinics || []
  const sections = brandData.product_sections || []

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleItemChange = (itemId: string, itemName: string, quantity: string, customQuantity?: string) => {
    setFormData((prev) => ({
      ...prev,
      items: {
        ...prev.items,
        [itemId]: {
          name: itemName,
          quantity,
          customQuantity: customQuantity || "",
        },
      },
    }))
  }

  const removeItem = (itemId: string) => {
    setFormData((prev) => {
      const newItems = { ...prev.items }
      delete newItems[itemId]
      return { ...prev, items: newItems }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.orderedBy || !formData.email || !formData.billTo || !formData.deliverTo) {
      toast.error("Please fill in all required fields")
      return
    }

    if (Object.keys(formData.items).length === 0) {
      toast.error("Please select at least one item")
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/submit-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          brandId: brandData.id,
          brandName: brandData.name,
          brandEmail: brandData.email,
          ...formData,
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast.success(result.message || "Order submitted successfully!")
        // Reset form
        setFormData({
          orderedBy: "",
          email: "",
          billTo: "",
          deliverTo: "",
          date: "",
          items: {},
        })
      } else {
        toast.error(result.message || "Failed to submit order")
      }
    } catch (error) {
      console.error("Error submitting order:", error)
      toast.error("Failed to submit order. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            {brandData.logo && (
              <img src={brandData.logo || "/placeholder.svg"} alt={brandData.name} className="h-8 w-8 object-contain" />
            )}
            {brandData.name} - Order Form
          </CardTitle>
          <CardDescription>Fill out the form below to place your printing order</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="orderedBy">Ordered By *</Label>
                <Input
                  id="orderedBy"
                  value={formData.orderedBy}
                  onChange={(e) => handleInputChange("orderedBy", e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Clinic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="billTo">Bill To Clinic *</Label>
                {clinics.length > 0 ? (
                  <Select value={formData.billTo} onValueChange={(value) => handleInputChange("billTo", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select clinic to bill" />
                    </SelectTrigger>
                    <SelectContent>
                      {clinics
                        .filter((clinic) => clinic && clinic.trim() !== "")
                        .map((clinic, index) => (
                          <SelectItem key={`bill-${index}`} value={clinic}>
                            {clinic}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id="billTo"
                    value={formData.billTo}
                    onChange={(e) => handleInputChange("billTo", e.target.value)}
                    placeholder="Enter clinic name"
                    required
                  />
                )}
              </div>
              <div>
                <Label htmlFor="deliverTo">Deliver To Clinic *</Label>
                {clinics.length > 0 ? (
                  <Select value={formData.deliverTo} onValueChange={(value) => handleInputChange("deliverTo", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select delivery clinic" />
                    </SelectTrigger>
                    <SelectContent>
                      {clinics
                        .filter((clinic) => clinic && clinic.trim() !== "")
                        .map((clinic, index) => (
                          <SelectItem key={`deliver-${index}`} value={clinic}>
                            {clinic}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id="deliverTo"
                    value={formData.deliverTo}
                    onChange={(e) => handleInputChange("deliverTo", e.target.value)}
                    placeholder="Enter clinic name"
                    required
                  />
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="date">Required Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange("date", e.target.value)}
              />
            </div>

            <Separator />

            {/* Product Selection */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Select Items</h3>
              {sections.length > 0 ? (
                <div className="space-y-6">
                  {sections.map((section) => (
                    <Card key={section.id}>
                      <CardHeader>
                        <CardTitle className="text-base">{section.name}</CardTitle>
                        {section.description && <CardDescription>{section.description}</CardDescription>}
                      </CardHeader>
                      <CardContent>
                        {section.items && section.items.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {section.items.map((item) => (
                              <div key={item.id} className="border rounded-lg p-4">
                                <div className="flex justify-between items-start mb-2">
                                  <h4 className="font-medium">{item.name}</h4>
                                  {formData.items[item.id] && (
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => removeItem(item.id)}
                                    >
                                      Remove
                                    </Button>
                                  )}
                                </div>
                                {item.description && <p className="text-sm text-gray-600 mb-2">{item.description}</p>}
                                {item.code && <p className="text-xs text-gray-500 mb-2">Code: {item.code}</p>}
                                <div className="space-y-2">
                                  <Label>Quantity</Label>
                                  <Select
                                    value={formData.items[item.id]?.quantity || ""}
                                    onValueChange={(value) => handleItemChange(item.id, item.name, value)}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select quantity" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="1">1</SelectItem>
                                      <SelectItem value="5">5</SelectItem>
                                      <SelectItem value="10">10</SelectItem>
                                      <SelectItem value="25">25</SelectItem>
                                      <SelectItem value="50">50</SelectItem>
                                      <SelectItem value="100">100</SelectItem>
                                      <SelectItem value="other">Other (specify)</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  {formData.items[item.id]?.quantity === "other" && (
                                    <Input
                                      placeholder="Enter custom quantity"
                                      value={formData.items[item.id]?.customQuantity || ""}
                                      onChange={(e) => handleItemChange(item.id, item.name, "other", e.target.value)}
                                    />
                                  )}
                                </div>
                                {item.sample_link && (
                                  <a
                                    href={item.sample_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-blue-600 hover:underline mt-2 inline-block"
                                  >
                                    View Sample
                                  </a>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500">No items available in this section</p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No product sections available</p>
              )}
            </div>

            {/* Selected Items Summary */}
            {Object.keys(formData.items).length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Selected Items</h3>
                <div className="space-y-2">
                  {Object.entries(formData.items).map(([itemId, item]) => (
                    <div key={itemId} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium">{item.name}</span>
                      <Badge variant="secondary">
                        {item.quantity === "other" ? `${item.customQuantity} (custom)` : item.quantity}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting Order...
                </>
              ) : (
                "Submit Order"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
