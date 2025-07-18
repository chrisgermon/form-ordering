"use client"

import React from "react"
import { useActionState } from "react"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SubmitButton } from "@/components/submit-button"
import { submitOrder } from "./actions"
import type { SafeFormProps, ActionState } from "@/lib/types"
import { useRouter } from "next/navigation"

const initialState: ActionState = {
  success: false,
  message: "",
}

function renderItem(item: SafeFormProps["sections"][0]["items"][0]) {
  const fieldId = `item_${item.id}`
  const fieldType = item.fieldType === "number" ? "number" : "text"

  return (
    <div key={item.id} className="grid grid-cols-3 items-center gap-4">
      <div className="col-span-2">
        <Label htmlFor={fieldId}>{String(item.name)}</Label>
        {item.code && <p className="text-sm text-muted-foreground">Code: {String(item.code)}</p>}
      </div>
      <Input id={fieldId} name={fieldId} type={fieldType} min="0" placeholder="Qty" className="text-right" />
    </div>
  )
}

export function ClientForm({ brand, locations, sections }: SafeFormProps) {
  const router = useRouter()
  const [state, formAction] = useActionState(submitOrder, initialState)

  React.useEffect(() => {
    if (state.success && state.submissionId) {
      router.push(`/forms/${brand.slug}/success?submissionId=${state.submissionId}`)
    }
  }, [state, brand.slug, router])

  return (
    <form action={formAction} className="space-y-8">
      <input type="hidden" name="brandId" value={brand.id} />
      <input type="hidden" name="brandSlug" value={brand.slug} />

      <Card>
        <CardHeader className="flex flex-row items-center gap-4">
          <Image
            src={brand.logo || "/placeholder-logo.svg"}
            alt={`${brand.name} Logo`}
            width={80}
            height={80}
            className="rounded-lg"
          />
          <div>
            <CardTitle className="text-2xl">{String(brand.name)}</CardTitle>
            <CardDescription>Order Form</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="location_id">Select Clinic Location</Label>
            <Select name="location_id" required>
              <SelectTrigger>
                <SelectValue placeholder="Select a location..." />
              </SelectTrigger>
              <SelectContent>
                {locations.map((loc) => (
                  <SelectItem key={loc.value} value={loc.value}>
                    {loc.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="ordered_by">Your Name</Label>
            <Input id="ordered_by" name="ordered_by" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="ordered_by_email">Your Email</Label>
            <Input id="ordered_by_email" name="ordered_by_email" type="email" required />
          </div>
        </CardContent>
      </Card>

      {sections.map((section) => (
        <Card key={section.id}>
          <CardHeader>
            <CardTitle>{String(section.title)}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">{section.items.map(renderItem)}</CardContent>
        </Card>
      ))}

      <Card>
        <CardHeader>
          <CardTitle>Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea id="notes" name="notes" placeholder="Add any additional notes for your order..." />
        </CardContent>
      </Card>

      <div className="flex flex-col items-center gap-4">
        <SubmitButton />
        {state && !state.success && (
          <p aria-live="polite" className="text-sm text-red-500">
            {state.message}
          </p>
        )}
      </div>
    </form>
  )
}
