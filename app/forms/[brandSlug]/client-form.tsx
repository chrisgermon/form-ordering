"use client"

import { useState } from "react"
import { useActionState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { submitOrder } from "./actions"
import type { FormData } from "@/lib/types"

interface ClientFormProps {
  formData: FormData
}

export const ClientForm = ({ formData }: ClientFormProps) => {
  const [state, formAction, isPending] = useActionState(submitOrder, null)
  const [quantities, setQuantities] = useState<Record<string, number>>({})

  console.log("ClientForm rendering with:", {
    brand: formData.brand?.name || "No brand",
    locationsCount: formData.locations?.length || 0,
    sectionsCount: formData.sections?.length || 0,
  })

  const handleQuantityChange = (itemId: string, value: string) => {
    const quantity = Number.parseInt(value) || 0
    setQuantities((prev) => ({
      ...prev,
      [itemId]: quantity,
    }))
  }

  // Create location options with safe string labels
  const locationOptions = (formData.locations || []).map((location) => {
    const name = String(location.name || "")
    const address = String(location.address || "")
    const label = address ? `${name} - ${address}` : name

    console.log("Creating location option:", { id: location.id, name, address, label })

    return {
      value: String(location.id),
      label: String(label),
    }
  })

  console.log("Location options created:", locationOptions)

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{String(formData.brand?.name || "Order Form")}</h1>
          <p className="text-gray-600">Please fill out the form below to place your order</p>
        </div>

        <form action={formAction} className="space-y-6">
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
                      {locationOptions.map((option) => (
                        <SelectItem key={String(option.value)} value={String(option.value)}>
                          {String(option.label)}
                        </SelectItem>
                      ))}
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
                      {locationOptions.map((option) => (
                        <SelectItem key={String(option.value)} value={String(option.value)}>
                          {String(option.label)}
                        </SelectItem>
                      ))}
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

          {(formData.sections || []).map((section) => (
            <Card key={String(section.id)}>
              <CardHeader>
                <CardTitle>{String(section.title)}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(section.items || []).map((item) => (
                    <div key={String(item.id)} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">{String(item.name)}</div>
                        {item.code && <div className="text-sm text-gray-500">Code: {String(item.code)}</div>}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Label htmlFor={`quantity-${String(item.id)}`} className="text-sm">
                          Qty:
                        </Label>
                        <Input
                          id={`quantity-${String(item.id)}`}
                          name={`quantity-${String(item.id)}`}
                          type="number"
                          min="0"
                          className="w-20"
                          value={quantities[String(item.id)] || 0}
                          onChange={(e) => handleQuantityChange(String(item.id), e.target.value)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}

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
