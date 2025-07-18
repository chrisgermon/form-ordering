"use client"

import React from "react"
import Image from "next/image"
import { useFormState } from "react-dom"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { SubmitButton } from "@/components/submit-button"

import { submitOrder } from "./actions"
import type { SafeFormProps } from "@/lib/types"

export function ClientForm({ brand, locations, sections }: SafeFormProps) {
  const router = useRouter()
  const initialState = { success: false, message: "", submissionId: null }
  const [state, formAction] = useFormState(submitOrder, initialState)

  React.useEffect(() => {
    if (state.message) {
      if (state.success) {
        toast.success(state.message)
        if (state.submissionId) {
          router.push(`/forms/${brand.slug}/success?id=${state.submissionId}`)
        }
      } else {
        toast.error(state.message)
      }
    }
  }, [state, router, brand.slug])

  const renderItem = (item: SafeFormProps["sections"][0]["items"][0]) => {
    const inputId = `item_${item.id}`
    return (
      <div key={item.id} className="grid grid-cols-3 items-center gap-4">
        <Label htmlFor={inputId} className="col-span-2">
          {item.name}
          {item.code && <span className="text-gray-500 text-sm ml-2">({item.code})</span>}
        </Label>
        <Input
          id={inputId}
          name={inputId}
          type={item.fieldType || "text"}
          placeholder="Qty"
          className="col-span-1 bg-gray-50"
        />
      </div>
    )
  }

  return (
    <div className="bg-gray-50 min-h-screen p-4 sm:p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        <form action={formAction}>
          <Card className="w-full shadow-lg">
            <CardHeader className="text-center space-y-2 py-8">
              {brand.logo && (
                <Image
                  src={brand.logo || "/placeholder.svg"}
                  alt={`${brand.name} Logo`}
                  width={240}
                  height={80}
                  className="mx-auto object-contain"
                  priority
                />
              )}
              <CardTitle className="text-3xl font-bold pt-4">{brand.name}</CardTitle>
              <CardDescription className="text-lg text-gray-600">Order Form</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8 px-4 md:px-8 pb-8">
              <input type="hidden" name="brandId" value={brand.id} />
              <input type="hidden" name="brandSlug" value={brand.slug} />

              <Card className="border-gray-200">
                <CardHeader>
                  <CardTitle className="text-xl">Your Details</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="ordered_by">Your Name</Label>
                    <Input id="ordered_by" name="ordered_by" required className="bg-gray-50" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ordered_by_email">Your Email</Label>
                    <Input id="ordered_by_email" name="ordered_by_email" type="email" required className="bg-gray-50" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="location_id">Clinic Location</Label>
                    <Select name="location_id" required>
                      <SelectTrigger className="w-full bg-gray-50">
                        <SelectValue placeholder="Select a location..." />
                      </SelectTrigger>
                      <SelectContent>
                        {locations.map((loc) => (
                          <SelectItem key={`loc-${loc.value}`} value={loc.value}>
                            {loc.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {sections.map((section) => (
                <Card key={section.id} className="border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-xl">{section.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">{section.items.map(renderItem)}</CardContent>
                </Card>
              ))}

              <Card className="border-gray-200">
                <CardHeader>
                  <CardTitle className="text-xl">Additional Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    name="notes"
                    placeholder="Any special instructions or comments?"
                    className="bg-gray-50 min-h-[100px]"
                  />
                </CardContent>
              </Card>

              <div className="text-center pt-4">
                <SubmitButton />
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  )
}
