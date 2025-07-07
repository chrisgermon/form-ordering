"use client"

import { useFormState, useFormStatus } from "react-dom"
import { useEffect, useState } from "react"
import { submitOrder } from "@/app/forms/[brand]/actions"
import type { Brand, Section, Item } from "@/lib/types"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { DatePicker } from "@/components/ui/date-picker"
import { toast } from "sonner"

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "Submitting..." : "Submit Order"}
    </Button>
  )
}

interface OrderFormProps {
  brand: Brand
  sections: Section[]
}

export function OrderForm({ brand, sections }: OrderFormProps) {
  const [state, formAction] = useFormState(submitOrder, { success: false, message: "" })
  const [dateFields, setDateFields] = useState<Record<string, Date | undefined>>({})

  useEffect(() => {
    if (state.success) {
      toast.success(state.message)
    } else if (state.message) {
      toast.error(state.message)
    }
  }, [state])

  const handleDateChange = (itemId: string, date: Date | undefined) => {
    setDateFields((prev) => ({ ...prev, [itemId]: date }))
  }

  const renderFormItem = (item: Item) => {
    const itemName = `item-${item.id}`
    switch (item.type) {
      case "text":
        return (
          <div key={item.id} className="space-y-2">
            <Label htmlFor={itemName}>{item.label}</Label>
            <Input id={itemName} name={itemName} placeholder={item.placeholder || ""} />
          </div>
        )
      case "textarea":
        return (
          <div key={item.id} className="space-y-2">
            <Label htmlFor={itemName}>{item.label}</Label>
            <Textarea id={itemName} name={itemName} placeholder={item.placeholder || ""} />
          </div>
        )
      case "checkbox":
        return (
          <div key={item.id} className="flex items-center space-x-2">
            <Checkbox id={itemName} name={itemName} />
            <Label htmlFor={itemName}>{item.label}</Label>
          </div>
        )
      case "radio":
        return (
          <div key={item.id} className="space-y-2">
            <Label>{item.label}</Label>
            <RadioGroup name={itemName}>
              {(item.options as string[])?.map((option) => (
                <div key={option} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={`${itemName}-${option}`} />
                  <Label htmlFor={`${itemName}-${option}`}>{option}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        )
      case "date":
        return (
          <div key={item.id} className="space-y-2">
            <Label>{item.label}</Label>
            <DatePicker date={dateFields[item.id]} onDateChange={(date) => handleDateChange(item.id, date)} />
            <input
              type="hidden"
              name={itemName}
              value={dateFields[item.id] ? dateFields[item.id]?.toISOString().split("T")[0] : ""}
            />
          </div>
        )
      default:
        return null
    }
  }

  if (state.success) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Order Submitted!</CardTitle>
          <CardDescription>Thank you for your order. A confirmation has been sent to your email.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <form action={formAction}>
      <input type="hidden" name="brandId" value={brand.id} />
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>{brand.name} Order Form</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4 p-4 border rounded-lg">
            <h3 className="font-semibold">Your Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ordered_by">Your Name</Label>
                <Input id="ordered_by" name="ordered_by" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Your Email</Label>
                <Input id="email" name="email" type="email" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="order_number">Order Number (Optional)</Label>
              <Input id="order_number" name="order_number" />
            </div>
          </div>

          <Accordion type="multiple" defaultValue={sections.map((s) => s.id)} className="w-full">
            {sections.map((section) => (
              <AccordionItem key={section.id} value={section.id}>
                <AccordionTrigger className="text-lg font-semibold">{section.title}</AccordionTrigger>
                <AccordionContent className="space-y-4 p-2">{section.items.map(renderFormItem)}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea id="notes" name="notes" placeholder="Any additional notes for your order..." />
          </div>
        </CardContent>
        <CardFooter>
          <SubmitButton />
        </CardFooter>
      </Card>
    </form>
  )
}
