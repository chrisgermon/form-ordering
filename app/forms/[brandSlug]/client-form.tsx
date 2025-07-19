"use client"

import * as React from "react"
import { useActionState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { submitOrder } from "./actions"
import type { SafeFormProps, ActionState } from "@/lib/types"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { SubmitButton } from "@/components/submit-button"

const initialState: ActionState = {
  success: false,
  message: "",
}

export function ClientForm(props: SafeFormProps) {
  const { brand, locations, sections } = props
  const [state, formAction] = useActionState(submitOrder, initialState)
  const router = useRouter()

  React.useEffect(() => {
    if (state.success && state.submissionId) {
      router.push(`/forms/${brand.slug}/success?id=${state.submissionId}`)
    }
  }, [state, router, brand.slug])

  return (
    <main className="container mx-auto p-4 md:p-8">
      <Card className="max-w-4xl mx-auto">
        <CardHeader className="flex flex-col items-center text-center">
          {brand.logo && (
            <Image
              src={brand.logo || "/placeholder.svg"}
              alt={`${brand.name} Logo`}
              width={150}
              height={150}
              className="object-contain mb-4"
            />
          )}
          <CardTitle className="text-2xl font-bold">{brand.name} Order Form</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-8">
            <input type="hidden" name="brandId" value={brand.id} />
            <input type="hidden" name="brandSlug" value={brand.slug} />

            {/* User and Location Info */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="ordered_by">Your Name</Label>
                <Input id="ordered_by" name="ordered_by" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ordered_by_email">Your Email</Label>
                <Input id="ordered_by_email" name="ordered_by_email" type="email" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location_id">Location</Label>
                <Select name="location_id" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a location" />
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
            </div>

            {/* Product Sections */}
            {sections.map((section) => (
              <div key={section.id} className="space-y-4 pt-4">
                <h3 className="text-lg font-semibold border-b pb-2">{section.title}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
                  {section.items.map((item) => (
                    <div key={item.id} className="space-y-2">
                      <Label htmlFor={`item_${item.id}`}>{item.name}</Label>
                      <Input
                        id={`item_${item.id}`}
                        name={`item_${item.id}`}
                        type={item.fieldType === "number" ? "number" : "text"}
                        min="0"
                        placeholder="Quantity"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" name="notes" placeholder="Add any additional notes here..." />
            </div>

            {/* Submission */}
            <div className="flex flex-col items-center gap-4">
              {!state.success && state.message && (
                <Alert variant="destructive" className="w-full">
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{state.message}</AlertDescription>
                </Alert>
              )}
              <SubmitButton />
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
