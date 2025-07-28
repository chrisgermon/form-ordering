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
import { Checkbox } from "@/components/ui/checkbox"
import { Search, ShoppingCart, User, ExternalLink, Loader2 } from "lucide-react"
import { toast } from "sonner"
import type { BrandWithSections, OrderItem, Clinic } from "@/lib/types"

interface OrderFormProps {
  brandData: BrandWithSections
}

export default function OrderForm({ brandData }: OrderFormProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    orderedBy: "",
    email: "",
    phone: "",
    billTo: "",
    deliverTo: "",
    specialInstructions: "",
    items: {} as Record<string, OrderItem>,
  })

  const clinics: Clinic[] = Array.isArray(brandData?.clinics)
    ? brandData.clinics
        .map((c) => {
          if (typeof c === "string") return { name: c.trim() }
          if (typeof c === "object" && c !== null && c.name) return { ...c, name: c.name.trim() }
          return null
        })
        .filter((c): c is Clinic => c !== null && c.name !== "")
    : []

  const productSections = Array.isArray(brandData?.product_sections) ? brandData.product_sections : []

  const filteredSections = productSections
    .map((section) => ({
      ...section,
      product_items: (section.product_items || []).filter(
        (item) =>
          item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase())),
      ),
    }))
    .filter((section) => section.product_items.length > 0)

  const selectedItemsCount = Object.keys(formData.items).length
  const selectedItems = Object.values(formData.items)

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleItemToggle = (itemId: string, itemName: string, quantity: string, customQuantity?: string) => {
    const itemKey = `${itemId}-${quantity}`
    setFormData((prev) => {
      const newItems = { ...prev.items }
      if (newItems[itemKey]) {
        delete newItems[itemKey]
      } else {
        newItems[itemKey] = {
          name: itemName,
          quantity,
          customQuantity,
        }
      }
      return { ...prev, items: newItems }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.orderedBy || !formData.email || !formData.billTo || !formData.deliverTo) {
      toast.error("Please fill in all required fields.")
      return
    }

    if (selectedItemsCount === 0) {
      toast.error("Please select at least one item.")
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/submit-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandId: brandData.id,
          brandName: brandData.name,
          brandEmail: brandData.email,
          ...formData,
        }),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        toast.success(result.message || "Order submitted successfully!")
        setFormData({
          orderedBy: "",
          email: "",
          phone: "",
          billTo: "",
          deliverTo: "",
          specialInstructions: "",
          items: {},
        })
      } else {
        console.error("Submission failed:", result)
        toast.error(result.error || "Failed to submit order", {
          description: result.details || "An unexpected error occurred. Please try again.",
        })
      }
    } catch (error) {
      console.error("Error submitting order:", error)
      toast.error("An error occurred while submitting your order. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!brandData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-gray-400" />
          <p className="mt-4 text-gray-600">Loading Form...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          {brandData.logo && (
            <img
              src={brandData.logo || "/placeholder.svg"}
              alt={`${brandData.name} logo`}
              className="mx-auto mb-4 h-20 w-auto object-contain"
            />
          )}
          <h1 className="text-3xl font-bold text-gray-900">{brandData.name}</h1>
          <p className="text-gray-600">Printing Order Form</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Order Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="orderedBy">Ordered By *</Label>
                    <Input
                      id="orderedBy"
                      value={formData.orderedBy}
                      onChange={(e) => handleInputChange("orderedBy", e.target.value)}
                      placeholder="Your full name"
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
                      placeholder="your.email@example.com"
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    placeholder="Your phone number"
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="billTo">Bill To Clinic *</Label>
                    {clinics.length > 0 ? (
                      <Select value={formData.billTo} onValueChange={(value) => handleInputChange("billTo", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select clinic" />
                        </SelectTrigger>
                        <SelectContent>
                          {clinics.map((clinic, index) => (
                            <SelectItem key={`bill-${index}`} value={clinic.name}>
                              {clinic.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        placeholder="No clinics configured - enter manually"
                        value={formData.billTo}
                        onChange={(e) => handleInputChange("billTo", e.target.value)}
                      />
                    )}
                  </div>
                  <div>
                    <Label htmlFor="deliverTo">Deliver To Clinic *</Label>
                    {clinics.length > 0 ? (
                      <Select
                        value={formData.deliverTo}
                        onValueChange={(value) => handleInputChange("deliverTo", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select delivery location" />
                        </SelectTrigger>
                        <SelectContent>
                          {clinics.map((clinic, index) => {
                            const deliveryValue = clinic.address ? `${clinic.name} - ${clinic.address}` : clinic.name
                            return (
                              <SelectItem key={`deliver-${index}`} value={deliveryValue}>
                                <div className="flex flex-col">
                                  <span>{clinic.name}</span>
                                  {clinic.address && (
                                    <span className="text-sm text-muted-foreground">{clinic.address}</span>
                                  )}
                                </div>
                              </SelectItem>
                            )
                          })}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        placeholder="No clinics configured - enter delivery address manually"
                        value={formData.deliverTo}
                        onChange={(e) => handleInputChange("deliverTo", e.target.value)}
                      />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Select Items
                </CardTitle>
                <CardDescription>Choose the items you need for your order</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      placeholder="Search items..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  {filteredSections.length > 0 ? (
                    filteredSections.map((section) => (
                      <div key={section.id}>
                        <h3 className="mb-4 text-lg font-semibold text-gray-900">{section.name}</h3>
                        <div className="grid gap-4">
                          {section.product_items?.map((item) => {
                            const quantities = (item as any).quantities || ["1", "5", "10", "25", "50", "100", "other"]
                            return (
                              <Card key={item.id} className="p-4">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      <h4 className="font-medium">{item.name}</h4>
                                      {(item as any).sample_link && (
                                        <a
                                          href={(item as any).sample_link}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-blue-600 hover:text-blue-800"
                                        >
                                          <ExternalLink className="h-4 w-4" />
                                        </a>
                                      )}
                                    </div>
                                    {item.description && (
                                      <p className="text-sm text-gray-600 mb-3">{item.description}</p>
                                    )}
                                    <div className="flex flex-wrap gap-2">
                                      {quantities.map((quantity: string) => {
                                        const itemKey = `${item.id}-${quantity}`
                                        const isSelected = !!formData.items[itemKey]

                                        if (quantity === "other") {
                                          return (
                                            <div key={quantity} className="flex items-center gap-2">
                                              <Checkbox
                                                id={itemKey}
                                                checked={isSelected}
                                                onCheckedChange={(checked) => {
                                                  if (checked) {
                                                    const customQuantity = prompt("Enter custom quantity:")
                                                    if (customQuantity) {
                                                      handleItemToggle(item.id, item.name, quantity, customQuantity)
                                                    }
                                                  } else {
                                                    handleItemToggle(item.id, item.name, quantity)
                                                  }
                                                }}
                                              />
                                              <Label htmlFor={itemKey} className="text-sm">
                                                Other
                                                {isSelected && formData.items[itemKey].customQuantity && (
                                                  <span className="ml-1 text-gray-500">
                                                    ({formData.items[itemKey].customQuantity})
                                                  </span>
                                                )}
                                              </Label>
                                            </div>
                                          )
                                        }

                                        return (
                                          <div key={quantity} className="flex items-center gap-2">
                                            <Checkbox
                                              id={itemKey}
                                              checked={isSelected}
                                              onCheckedChange={() => handleItemToggle(item.id, item.name, quantity)}
                                            />
                                            <Label htmlFor={itemKey} className="text-sm">
                                              {quantity}
                                            </Label>
                                          </div>
                                        )
                                      })}
                                    </div>
                                  </div>
                                </div>
                              </Card>
                            )
                          })}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500">
                        {searchTerm ? `No items found matching "${searchTerm}"` : "No items available"}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <Badge variant="secondary" className="text-sm">
                    {selectedItemsCount} item{selectedItemsCount !== 1 ? "s" : ""} selected
                  </Badge>
                </div>

                {selectedItems.length > 0 && (
                  <div className="space-y-2 mb-6">
                    {selectedItems.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="truncate">{item.name}</span>
                        <span className="text-gray-500">
                          {item.quantity === "other" ? item.customQuantity : item.quantity}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <Separator className="my-4" />

                <form onSubmit={handleSubmit}>
                  <Button type="submit" className="w-full" disabled={isSubmitting || selectedItemsCount === 0}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Submit Order"
                    )}
                  </Button>
                </form>

                <div className="mt-4 text-xs text-gray-500">
                  <p>
                    Orders will be sent to {brandData.email} for processing. You will receive a confirmation email once
                    submitted.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
