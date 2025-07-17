"use client"

import { useState, useEffect } from "react"
import { useActionState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { submitOrder } from "./actions"

interface LocationOption {
  value: string
  label: string
}

interface FormItem {
  id: string
  name: string
  code?: string
  description?: string
  field_type: string
  placeholder?: string
  is_required: boolean
  order_index: number
  section_id: string
  brand_id: string
}

interface FormSection {
  id: string
  title: string
  order_index: number
  brand_id: string
  items: FormItem[]
}

interface SimpleBrand {
  name: string
  slug: string
  logo?: string
}

interface ClientFormData {
  brand: SimpleBrand
  locationOptions: LocationOption[]
  sections: FormSection[]
}

interface ClientFormProps {
  formData: ClientFormData
}

export const ClientForm = ({ formData }: ClientFormProps) => {
  const [state, formAction, isPending] = useActionState(submitOrder, null)
  const [quantities, setQuantities] = useState<Record<string, number>>({})

  useEffect(() => {
    console.log("=== CLIENT FORM MOUNT ===")
    console.log("Form data received:", formData)
    console.log("Brand:", formData?.brand)
    console.log("Location options:", formData?.locationOptions)
    console.log("Sections:", formData?.sections)
    console.log("=== CLIENT FORM MOUNT END ===")
  }, [formData])

  const handleQuantityChange = (itemId: string, value: string) => {
    const quantity = Number.parseInt(value) || 0
    setQuantities((prev) => ({
      ...prev,
      [itemId]: quantity,
    }))
  }

  // Extra safety checks
  if (!formData) {
    console.error("No form data provided")
    return <div>Error: No form data</div>
  }

  if (!formData.brand) {
    console.error("No brand data provided")
    return <div>Error: No brand data</div>
  }

  if (!Array.isArray(formData.locationOptions)) {
    console.error("Location options is not an array:", formData.locationOptions)
    return <div>Error: Invalid location options</div>
  }

  if (!Array.isArray(formData.sections)) {
    console.error("Sections is not an array:", formData.sections)
    return <div>Error: Invalid sections data</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{String(formData.brand.name)}</h1>
          <p className="text-gray-600">Please fill out the form below to place your order</p>
        </div>

        <form action={formAction} className="space-y-6">
          {/* Hidden field for brand slug */}
          <input type="hidden" name="brandSlug" value={String(formData.brand.slug)} />

          <Card>
            <CardHeader>
              <CardTitle>Order Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="orderedBy">Ordered By</Label>
                  <Input id="orderedBy" name="orderedBy" required placeholder="Your full name" />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" required placeholder="your.email@example.com" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="deliverTo">Deliver To</Label>
                  <Select name="deliverTo" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select delivery location" />
                    </SelectTrigger>
                    <SelectContent>
                      {formData.locationOptions.map((option) => {
                        // Triple check that we're only using strings
                        const safeValue = String(option?.value || "")
                        const safeLabel = String(option?.label || "Unknown Location")

                        console.log("Rendering delivery option:", { safeValue, safeLabel })

                        return (
                          <SelectItem key={safeValue} value={safeValue}>
                            {safeLabel}
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="billTo">Bill To</Label>
                  <Select name="billTo" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select billing location" />
                    </SelectTrigger>
                    <SelectContent>
                      {formData.locationOptions.map((option) => {
                        // Triple check that we're only using strings
                        const safeValue = String(option?.value || "")
                        const safeLabel = String(option?.label || "Unknown Location")

                        console.log("Rendering billing option:", { safeValue, safeLabel })

                        return (
                          <SelectItem key={safeValue} value={safeValue}>
                            {safeLabel}
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea id="notes" name="notes" placeholder="Any special instructions or notes" rows={3} />
              </div>
            </CardContent>
          </Card>

          {formData.sections.map((section) => {
            const sectionId = String(section?.id || "")
            const sectionTitle = String(section?.title || "Untitled Section")

            console.log("Rendering section:", { sectionId, sectionTitle })

            return (
              <Card key={sectionId}>
                <CardHeader>
                  <CardTitle>{sectionTitle}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {(section?.items || []).map((item) => {
                      const itemId = String(item?.id || "")
                      const itemName = String(item?.name || "Untitled Item")
                      const itemCode = item?.code ? String(item.code) : null

                      console.log("Rendering item:", { itemId, itemName, itemCode })

                      return (
                        <div key={itemId} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <div className="font-medium">{itemName}</div>
                            {itemCode && <div className="text-sm text-gray-500">Code: {itemCode}</div>}
                          </div>
                          <div className="flex items-center space-x-2">
                            <Label htmlFor={`quantity-${itemId}`} className="text-sm">
                              Qty:
                            </Label>
                            <Input
                              id={`quantity-${itemId}`}
                              name={`quantity-${itemId}`}
                              type="number"
                              min="0"
                              className="w-20"
                              value={quantities[itemId] || 0}
                              onChange={(e) => handleQuantityChange(itemId, e.target.value)}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )
          })}

          <div className="flex justify-center">
            <Button type="submit" size="lg" disabled={isPending}>
              {isPending ? "Submitting Order..." : "Submit Order"}
            </Button>
          </div>

          {state?.error && (
            <div className="text-center text-red-600 bg-red-50 p-4 rounded-lg">{String(state.error)}</div>
          )}
        </form>
      </div>
    </div>
  )
}
