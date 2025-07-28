"use client"

import type React from "react"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Search, Upload, ExternalLink } from "lucide-react"
import { toast } from "sonner"
import type { Brand, ProductSection, ProductItem, Clinic } from "@/lib/types"

type OrderFormProps = {
  brand: Brand & {
    product_sections: Array<
      ProductSection & {
        product_items: ProductItem[]
      }
    >
  }
}

export function OrderForm({ brand }: OrderFormProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedItems, setSelectedItems] = useState<Record<string, string>>({})
  const [attachments, setAttachments] = useState<Record<string, File>>({})
  const [orderedBy, setOrderedBy] = useState("")
  const [deliverTo, setDeliverTo] = useState("")
  const [specialInstructions, setSpecialInstructions] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Safely access clinics with fallback
  const clinics: Clinic[] = Array.isArray(brand.clinics) ? brand.clinics : []
  const productSections = Array.isArray(brand.product_sections) ? brand.product_sections : []

  // Filter items based on search term
  const filteredSections = useMemo(() => {
    if (!searchTerm) return productSections

    return productSections
      .map((section) => ({
        ...section,
        product_items: (section.product_items || []).filter(
          (item) =>
            item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase())),
        ),
      }))
      .filter((section) => section.product_items.length > 0)
  }, [productSections, searchTerm])

  const handleItemChange = (itemName: string, quantity: string) => {
    setSelectedItems((prev) => {
      if (quantity === "" || quantity === "0") {
        const { [itemName]: removed, ...rest } = prev
        return rest
      }
      return { ...prev, [itemName]: quantity }
    })
  }

  const handleFileChange = (itemName: string, file: File | null) => {
    setAttachments((prev) => {
      if (!file) {
        const { [itemName]: removed, ...rest } = prev
        return rest
      }
      return { ...prev, [itemName]: file }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (Object.keys(selectedItems).length === 0) {
      toast.error("Please select at least one item")
      return
    }

    if (!orderedBy.trim()) {
      toast.error("Please enter who is placing the order")
      return
    }

    if (!deliverTo.trim()) {
      toast.error("Please select a delivery location")
      return
    }

    setIsSubmitting(true)

    try {
      const formData = new FormData()
      formData.append("brand", brand.slug)
      formData.append("ordered_by", orderedBy)
      formData.append("deliver_to", deliverTo)
      formData.append("special_instructions", specialInstructions)

      // Add selected items
      Object.entries(selectedItems).forEach(([itemName, quantity]) => {
        formData.append(`item_${itemName}`, quantity)
      })

      // Add attachments
      Object.entries(attachments).forEach(([itemName, file]) => {
        formData.append(`attachment_${itemName}`, file)
      })

      const response = await fetch("/api/submit-order", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to submit order")
      }

      toast.success("Order submitted successfully!")

      // Reset form
      setSelectedItems({})
      setAttachments({})
      setOrderedBy("")
      setDeliverTo("")
      setSpecialInstructions("")
      setSearchTerm("")
    } catch (error) {
      console.error("Error submitting order:", error)
      toast.error(error instanceof Error ? error.message : "Failed to submit order")
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedItemsCount = Object.keys(selectedItems).length

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              {brand.logo && (
                <img src={brand.logo || "/placeholder.svg"} alt={`${brand.name} logo`} className="h-10 w-auto" />
              )}
              <h1 className="text-2xl font-bold text-gray-900">{brand.name}</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Search */}
            <Card>
              <CardContent className="pt-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    type="text"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Product Sections */}
            {filteredSections.map((section) => (
              <Card key={section.id}>
                <CardHeader>
                  <CardTitle>{section.title}</CardTitle>
                  {section.description && <p className="text-sm text-gray-600">{section.description}</p>}
                </CardHeader>
                <CardContent className="space-y-4">
                  {(section.product_items || []).map((item) => {
                    const quantities = Array.isArray(item.quantities) ? item.quantities : []
                    const selectedQuantity = selectedItems[item.name] || ""

                    return (
                      <div key={item.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{item.name}</h4>
                            {item.description && <p className="text-sm text-gray-600 mt-1">{item.description}</p>}
                            {item.sample_link && (
                              <a
                                href={item.sample_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 mt-2"
                              >
                                <ExternalLink className="h-3 w-3 mr-1" />
                                CHECK HERE
                              </a>
                            )}
                          </div>
                        </div>

                        {/* Quantity Selection */}
                        {quantities.length > 0 && (
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">Quantity</Label>
                            <div className="flex flex-wrap gap-2">
                              {quantities.map((qty) => (
                                <label key={qty} className="flex items-center space-x-2 cursor-pointer">
                                  <Checkbox
                                    checked={selectedQuantity === qty}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        handleItemChange(item.name, qty)
                                      } else {
                                        handleItemChange(item.name, "")
                                      }
                                    }}
                                  />
                                  <span className="text-sm">{qty}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* File Upload */}
                        {selectedQuantity && (
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">Upload file (optional)</Label>
                            <div className="flex items-center space-x-2">
                              <Input
                                type="file"
                                onChange={(e) => {
                                  const file = e.target.files?.[0] || null
                                  handleFileChange(item.name, file)
                                }}
                                className="flex-1"
                              />
                              <Upload className="h-4 w-4 text-gray-400" />
                            </div>
                            {attachments[item.name] && (
                              <p className="text-xs text-gray-500">Selected: {attachments[item.name].name}</p>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </CardContent>
              </Card>
            ))}

            {filteredSections.length === 0 && searchTerm && (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-gray-500">No products found matching "{searchTerm}"</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Order Summary */}
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedItemsCount > 0 ? (
                  <div className="space-y-2">
                    {Object.entries(selectedItems).map(([itemName, quantity]) => (
                      <div key={itemName} className="flex justify-between items-center text-sm">
                        <span className="truncate flex-1 mr-2">{itemName}</span>
                        <Badge variant="secondary">{quantity}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No items selected</p>
                )}

                <Separator />

                {/* Order Details Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="ordered_by">Ordered By *</Label>
                    <Input
                      id="ordered_by"
                      type="text"
                      value={orderedBy}
                      onChange={(e) => setOrderedBy(e.target.value)}
                      placeholder="Your name"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="deliver_to">Deliver To *</Label>
                    <Select value={deliverTo} onValueChange={setDeliverTo} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select delivery location" />
                      </SelectTrigger>
                      <SelectContent>
                        {clinics.map((clinic) => (
                          <SelectItem key={clinic.name} value={clinic.address || clinic.name}>
                            {clinic.name}
                            {clinic.address && <div className="text-xs text-gray-500 mt-1">{clinic.address}</div>}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="special_instructions">Special Instructions</Label>
                    <Textarea
                      id="special_instructions"
                      value={specialInstructions}
                      onChange={(e) => setSpecialInstructions(e.target.value)}
                      placeholder="Any special delivery instructions..."
                      rows={3}
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={selectedItemsCount === 0 || isSubmitting}>
                    {isSubmitting ? "Submitting..." : `Submit Order (${selectedItemsCount} items)`}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
