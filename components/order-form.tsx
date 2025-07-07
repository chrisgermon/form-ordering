"use client"

import { useFormState } from "react-dom"
import { useEffect, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { DatePicker } from "@/components/ui/date-picker"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { submitOrder } from "@/app/forms/[brand]/actions"
import type { Brand, Section, FormItem as FormItemType } from "@/lib/types"

const formSchema = z.object({
  patient_name: z.string().min(1, "Patient name is required"),
  patient_dob: z.date({ required_error: "Patient DOB is required" }),
  patient_phone: z.string().min(1, "Patient phone is required"),
  patient_email: z.string().email("Invalid email address").optional().or(z.literal("")),
  patient_medicare: z.string().optional(),
  referrer_name: z.string().min(1, "Referrer name is required"),
  referrer_provider_number: z.string().min(1, "Provider number is required"),
  referrer_email: z.string().email("Invalid email address").optional().or(z.literal("")),
  clinic_name: z.string().min(1, "Clinic name is required"),
  urgent: z.boolean().default(false),
  items: z
    .array(
      z.object({
        name: z.string(),
        quantity: z.number().min(1),
      }),
    )
    .min(1, "Please select at least one item."),
})

type FormData = z.infer<typeof formSchema>

interface OrderFormProps {
  brand: Brand & { sections: (Section & { items: FormItemType[] })[] }
}

export function OrderForm({ brand }: OrderFormProps) {
  const formRef = useRef<HTMLFormElement>(null)
  const [state, formAction] = useFormState(submitOrder.bind(null, brand), {
    success: false,
    message: "",
  })

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      patient_name: "",
      patient_phone: "",
      patient_email: "",
      patient_medicare: "",
      referrer_name: "",
      referrer_provider_number: "",
      referrer_email: "",
      clinic_name: "",
      urgent: false,
      items: [],
    },
  })

  useEffect(() => {
    if (state.message) {
      if (state.success) {
        toast.success(state.message)
        form.reset()
      } else {
        toast.error(state.message)
      }
    }
  }, [state, form])

  const onSubmit = (data: FormData) => {
    const formData = new FormData()
    Object.entries(data).forEach(([key, value]) => {
      if (key === "items" && Array.isArray(value)) {
        value.forEach((item, index) => {
          formData.append(`items[${index}].name`, item.name)
          formData.append(`items[${index}].quantity`, String(item.quantity))
        })
      } else if (key === "patient_dob" && value instanceof Date) {
        formData.append(key, value.toISOString().split("T")[0])
      } else if (typeof value === "boolean") {
        if (value) formData.append(key, "on")
      } else {
        formData.append(key, String(value))
      }
    })
    formAction(formData)
  }

  const handleItemChange = (checked: boolean, item: FormItemType) => {
    const currentItems = form.getValues("items")
    const newItems = checked
      ? [...currentItems, { name: item.name, quantity: 1 }]
      : currentItems.filter((i) => i.name !== item.name)
    form.setValue("items", newItems, { shouldValidate: true })
  }

  return (
    <Form {...form}>
      <form ref={formRef} onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Patient Details</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="patient_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Patient Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="patient_dob"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date of Birth</FormLabel>
                  <FormControl>
                    <DatePicker date={field.value} setDate={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="patient_phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="patient_email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email (Optional)</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="patient_medicare"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Medicare Number (Optional)</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Referrer Details</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="referrer_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Referrer Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="referrer_provider_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Provider Number</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="clinic_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Clinic Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="referrer_email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Referrer Email (for copy of results)</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Order Items</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="multiple" className="w-full">
              {brand.sections.map((section) => (
                <AccordionItem value={section.id} key={section.id}>
                  <AccordionTrigger>{section.name}</AccordionTrigger>
                  <AccordionContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {section.items.map((item) => (
                      <FormField
                        key={item.id}
                        control={form.control}
                        name="items"
                        render={() => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl>
                              <Checkbox
                                checked={form.watch("items").some((i) => i.name === item.name)}
                                onCheckedChange={(checked) => handleItemChange(!!checked, item)}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>{item.name}</FormLabel>
                            </div>
                          </FormItem>
                        )}
                      />
                    ))}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
            <FormField
              control={form.control}
              name="items"
              render={() => (
                <FormItem>
                  <FormMessage className="mt-4" />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex items-center justify-between">
          <FormField
            control={form.control}
            name="urgent"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <Label>Mark as Urgent</Label>
              </FormItem>
            )}
          />
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Submitting..." : "Submit Order"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
