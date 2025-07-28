"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon, Loader2 } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import type { Brand } from "@/lib/types"

interface OrderFormProps {
  brandData: Brand
}

export default function OrderForm({ brandData }: OrderFormProps) {
  const [formData, setFormData] = useState({
    orderedBy: "",
    email: "",
    billTo: "",
    deliverTo: "",
    date: null as Date | null,
    items: {} as Record<string, { name: string; code: string; quantity: string; customQuantity?: string }>,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitMessage, setSubmitMessage] = useState("")

  if (!brandData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <p>Loading brand information...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const clinics = brandData.clinics || []
  const sections = brandData.product_sections || []

  const handleItemChange = (
    itemId: string,
    itemName: string,
    itemCode: string,
    quantity: string,
    customQuantity?: string,
  ) => {
    setFormData((prev) => ({
      ...prev,
      items: {
        ...prev.items,
        [itemId]: {
          name: itemName,
          code: itemCode,
          quantity,
          customQuantity,
        },
      },
    }))
  }

  const handleItemRemove = (itemId: string) => {
    setFormData((prev) => {
      const newItems = { ...prev.items }
      delete newItems[itemId]
      return {
        ...prev,
        items: newItems,
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitMessage("")

    try {
      // Validate required fields
      if (!formData.orderedBy || !formData.email || !formData.billTo || !formData.deliverTo) {
        throw new Error("Please fill in all required fields")
      }

      if (Object.keys(formData.items).length === 0) {
        throw new Error("Please select at least one item")
      }

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
        setSubmitMessage("Order submitted successfully!")
        // Reset form
        setFormData({
          orderedBy: "",
          email: "",
          billTo: "",
          deliverTo: "",
          date: null,
          items: {},
        })
      } else {
        throw new Error(result.message || "Failed to submit order")
      }
    } catch (error) {
      console.error("Error submitting order:", error)
      setSubmitMessage(error instanceof Error ? error.message : "Failed to submit order")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">{brandData.name}</h1>
          <p className="text-gray-600">Printing Order Form</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Information</CardTitle>
              <CardDescription>Please fill in your details and select the items you need.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="orderedBy">Ordered By *</Label>
                  <Input
                    id="orderedBy"
                    value={formData.orderedBy}
                    onChange={(e) => setFormData((prev) => ({ ...prev, orderedBy: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="billTo">Bill to Clinic *</Label>
                  {clinics.length > 0 ? (
                    <Select
                      value={formData.billTo}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, billTo: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select clinic" />
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
                      onChange={(e) => setFormData((prev) => ({ ...prev, billTo: e.target.value }))}
                      placeholder="Enter clinic name"
                      required
                    />
                  )}
                </div>
                <div>
                  <Label htmlFor="deliverTo">Deliver to Clinic *</Label>
                  {clinics.length > 0 ? (
                    <Select
                      value={formData.deliverTo}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, deliverTo: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select clinic" />
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
                      onChange={(e) => setFormData((prev) => ({ ...prev, deliverTo: e.target.value }))}
                      placeholder="Enter clinic name"
                      required
                    />
                  )}
                </div>
              </div>

              <div>
                <Label>Order Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.date && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.date ? format(formData.date, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.date}
                      onSelect={(date) => setFormData((prev) => ({ ...prev, date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </CardContent>
          </Card>

          {sections.length > 0 ? (
            sections.map((section) => (
              <Card key={section.id}>
                <CardHeader>
                  <CardTitle>{section.name}</CardTitle>
                  {section.description && <CardDescription>{section.description}</CardDescription>}
                </CardHeader>
                <CardContent>
                  {section.items && section.items.length > 0 ? (
                    <div className="space-y-4">
                      {section.items.map((item) => {
                        const isSelected = formData.items[item.id]
                        return (
                          <div key={item.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  handleItemChange(item.id, item.name, item.code || "", "1")
                                } else {
                                  handleItemRemove(item.id)
                                }
                              }}
                            />
                            <div className="flex-1">
                              <div className="font-medium">{item.name}</div>
                              {item.code && <div className="text-sm text-gray-500">Code: {item.code}</div>}
                              {item.description && <div className="text-sm text-gray-600">{item.description}</div>}
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
                            {isSelected && (
                              <div className="flex items-center space-x-2">
                                <Label htmlFor={`quantity-${item.id}`} className="text-sm">
                                  Quantity:
                                </Label>
                                <Select
                                  value={formData.items[item.id]?.quantity || "1"}
                                  onValueChange={(value) => {
                                    handleItemChange(item.id, item.name, item.code || "", value)
                                  }}
                                >
                                  <SelectTrigger className="w-24">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="1">1</SelectItem>
                                    <SelectItem value="2">2</SelectItem>
                                    <SelectItem value="3">3</SelectItem>
                                    <SelectItem value="4">4</SelectItem>
                                    <SelectItem value="5">5</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                  </SelectContent>
                                </Select>
                                {formData.items[item.id]?.quantity === "other" && (
                                  <Input
                                    type="number"
                                    placeholder="Enter quantity"
                                    className="w-32"
                                    value={formData.items[item.id]?.customQuantity || ""}
                                    onChange={(e) => {
                                      handleItemChange(item.id, item.name, item.code || "", "other", e.target.value)
                                    }}
                                  />
                                )}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="text-gray-500">No items available in this section.</p>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-gray-500">No product sections configured for this brand.</p>
              </CardContent>
            </Card>
          )}

          {Object.keys(formData.items).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Selected Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(formData.items).map(([itemId, item]) => (
                    <div key={itemId} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span>{item.name}</span>
                      <Badge variant="secondary">
                        {item.quantity === "other" ? `${item.customQuantity} (custom)` : item.quantity}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end space-x-4">
            <Button
              type="submit"
              disabled={isSubmitting || Object.keys(formData.items).length === 0}
              className="min-w-32"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Order"
              )}
            </Button>
          </div>

          {submitMessage && (
            <div
              className={`p-4 rounded-lg ${submitMessage.includes("successfully") ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}
            >
              {submitMessage}
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
