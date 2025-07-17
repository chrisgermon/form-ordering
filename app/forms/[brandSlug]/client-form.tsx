"use client"

import React, { useTransition } from "react"
import { useFormState } from "react-dom"
import { toast } from "sonner"
import Image from "next/image"

import { submitOrder } from "./actions"
import type { SafeFormProps } from "@/lib/types"
import { resolveAssetUrl } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { SubmitButton } from "@/components/submit-button"

const initialState = { message: "", success: false, errors: null }

export function ClientForm(props: SafeFormProps) {
  const { brand, locations, sections } = props
  const [state, formAction] = useFormState(submitOrder, initialState)
  const [isPending, startTransition] = useTransition()

  // This effect will show a toast message after the server action completes
  React.useEffect(() => {
    if (state.message) {
      if (state.success) {
        toast.success(state.message)
      } else {
        toast.error(state.message, {
          description: state.errors ? JSON.stringify(state.errors) : undefined,
        })
      }
    }
  }, [state])

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    startTransition(() => {
      formAction(formData)
    })
  }

  console.log("--- CLIENT: RENDERING FORM ---")

  return (
    <div className="container mx-auto p-4 md:p-8">
      <Card className="max-w-4xl mx-auto">
        <CardHeader className="text-center">
          {brand.logo && (
            <Image
              src={resolveAssetUrl(brand.logo) || "/placeholder.svg"}
              alt={`${brand.name} Logo`}
              width={200}
              height={100}
              className="mx-auto mb-4 object-contain"
            />
          )}
          <CardTitle className="text-3xl font-bold">{brand.name} Order Form</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Hidden input to pass brand slug */}
            <input type="hidden" name="brandSlug" value={brand.slug} />

            <Card>
              <CardHeader>
                <CardTitle>Order Information</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="orderedBy">Your Name</Label>
                  <Input id="orderedBy" name="orderedBy" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Your Email</Label>
                  <Input id="email" name="email" type="email" required />
                </div>
                <div className="space-y-2">
                  <Label>Bill To</Label>
                  <Select name="billToId" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a billing location" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map((loc) => {
                        const key = `bill-${loc.value}`
                        const value = loc.value
                        const label = loc.label
                        console.log(`Rendering Bill To Option: key=${key}, value=${value}, label is a ${typeof label}`)
                        return (
                          <SelectItem key={key} value={value}>
                            {label}
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Deliver To</Label>
                  <Select name="deliverToId" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a delivery location" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map((loc) => {
                        const key = `deliver-${loc.value}`
                        const value = loc.value
                        const label = loc.label
                        console.log(
                          `Rendering Deliver To Option: key=${key}, value=${value}, label is a ${typeof label}`,
                        )
                        return (
                          <SelectItem key={key} value={value}>
                            {label}
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {sections.map((section) => (
              <Card key={section.id}>
                <CardHeader>
                  <CardTitle>{section.title}</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                  {section.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between">
                      <Label htmlFor={item.id} className="flex-1">
                        {item.name} {item.code && `(${item.code})`}
                      </Label>
                      {item.fieldType === "checkbox" ? (
                        <Checkbox id={item.id} name={`item-${item.id}`} value="true" />
                      ) : (
                        <Input
                          id={item.id}
                          name={`item-${item.id}`}
                          type={item.fieldType === "number" ? "number" : "text"}
                          className="w-24"
                          min={item.fieldType === "number" ? "0" : undefined}
                        />
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}

            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea name="notes" placeholder="Optional notes or special instructions..." />
              </CardContent>
            </Card>

            <div className="text-center">
              <SubmitButton isPending={isPending}>Submit Order</SubmitButton>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
