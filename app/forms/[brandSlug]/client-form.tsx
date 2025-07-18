"use client"

import React from "react"
import Image from "next/image"
import { useActionState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { submitOrder } from "./actions"
import type { SafeFormProps, ActionState } from "@/lib/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { SubmitButton } from "@/components/submit-button"

const initialState: ActionState = {
  success: false,
  message: "",
  submissionId: undefined,
}

function renderItem(item: SafeFormProps["sections"][0]["items"][0]) {
  const fieldId = `item_${item.id}`
  return (
    <div key={item.id} className="grid grid-cols-3 items-center gap-4">
      <Label htmlFor={fieldId} className="col-span-2">
        {item.name}
        {item.code && <span className="text-xs text-muted-foreground ml-2">({item.code})</span>}
      </Label>
      <Input id={fieldId} name={fieldId} type="number" min="0" placeholder="Qty" className="w-full text-right" />
    </div>
  )
}

export function ClientForm({ brand, locations, sections }: SafeFormProps) {
  const router = useRouter()
  const [state, formAction] = useActionState(submitOrder, initialState)

  React.useEffect(() => {
    if (state.message) {
      if (state.success) {
        toast.success("Order Submitted!", {
          description: state.message,
        })
      } else {
        toast.error("Submission Failed", {
          description: state.message,
        })
      }
    }

    if (state.submissionId) {
      router.push(`/forms/${brand.slug}/success?id=${state.submissionId}`)
    }
  }, [state, router, brand.slug])

  return (
    <form action={formAction} className="space-y-8">
      <input type="hidden" name="brandId" value={brand.id} />
      <input type="hidden" name="brandSlug" value={brand.slug} />

      <Card>
        <CardHeader className="flex flex-col items-center text-center">
          {brand.logo && (
            <Image
              src={brand.logo || "/placeholder.svg"}
              alt={brand.name}
              width={200}
              height={100}
              className="object-contain"
              priority
            />
          )}
          <CardTitle className="text-2xl mt-4">{brand.name}</CardTitle>
          <CardDescription>Order Form</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="ordered_by">Your Name</Label>
            <Input id="ordered_by" name="ordered_by" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="ordered_by_email">Your Email</Label>
            <Input id="ordered_by_email" name="ordered_by_email" type="email" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="location_id">Clinic Location</Label>
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
        </CardContent>
      </Card>

      {sections.map((section) => (
        <Card key={section.id}>
          <CardHeader>
            <CardTitle>{section.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">{section.items.map(renderItem)}</CardContent>
        </Card>
      ))}

      <Card>
        <CardHeader>
          <CardTitle>Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea name="notes" placeholder="Add any special instructions here..." />
        </CardContent>
      </Card>
      <div className="flex justify-center">
        <SubmitButton />
      </div>
    </form>
  )
}
