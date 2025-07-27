"use client"

import { useState, useMemo } from "react"
import { useForm, useFieldArray, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import type { Brand, Section, Item } from "@/lib/types"
import { Loader2, Eye, Trash2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"

const formSchema = z.object({
  clinicName: z.string().min(1, "Clinic is required."),
  clinicAddress: z.string().optional(),
  contactPerson: z.string().min(1, "Contact person is required."),
  contactEmail: z.string().email("Invalid email address."),
  items: z
    .array(
      z.object({
        id: z.number(),
        code: z.string(),
        name: z.string(),
        quantity: z.string().min(1, "Please select a quantity."),
        otherQuantity: z.string().optional(),
      }),
    )
    .min(1, "Please select at least one item to order."),
})

type OrderFormValues = z.infer<typeof formSchema>

interface OrderFormProps {
  brand: Brand & {
    sections: (Section & {
      items: Item[]
    })[]
  }
}

export function OrderForm({ brand }: OrderFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const { toast } = useToast()

  const form = useForm<OrderFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      clinicName: "",
      clinicAddress: "",
      contactPerson: "",
      contactEmail: "",
      items: [],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  })

  const selectedItems = form.watch("items")

  const handleAddItem = (item: Item) => {
    const existingItemIndex = fields.findIndex((field) => field.id === item.id)
    if (existingItemIndex === -1) {
      append({
        id: item.id,
        code: item.code,
        name: item.name,
        quantity: item.quantities?.[0] || "other",
        otherQuantity: "",
      })
    }
  }

  const handleRemoveItem = (index: number) => {
    remove(index)
  }

  const handlePreview = (url: string | null | undefined) => {
    if (url) {
      setPreviewUrl(url)
      setIsPreviewOpen(true)
    } else {
      toast({
        title: "No Preview Available",
        description: "A sample PDF has not been assigned to this item yet.",
        variant: "destructive",
      })
    }
  }

  const onSubmit = async (values: OrderFormValues) => {
    setIsSubmitting(true)
    try {
      const response = await fetch("/api/submit-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, brandName: brand.name, brandEmail: brand.recipient_email }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Something went wrong.")
      }

      toast({
        title: "Order Submitted!",
        description: "Your order has been successfully submitted. A confirmation has been sent to your email.",
      })
      form.reset()
    } catch (error) {
      toast({
        title: "Submission Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const clinicOptions = useMemo(() => {
    return brand.clinics && Array.isArray(brand.clinics) ? brand.clinics : []
  }, [brand.clinics])

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Select Products</CardTitle>
                </CardHeader>
                <CardContent>
                  <Accordion type="multiple" className="w-full">
                    {brand.sections
                      .sort((a, b) => a.sort_order - b.sort_order)
                      .map((section) => (
                        <AccordionItem key={section.id} value={String(section.id)}>
                          <AccordionTrigger>{section.title}</AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-4">
                              {section.items
                                .sort((a, b) => a.sort_order - b.sort_order)
                                .map((item) => (
                                  <div
                                    key={item.id}
                                    className="flex items-center justify-between p-3 rounded-md border bg-muted/20"
                                  >
                                    <div>
                                      <p className="font-semibold">{item.name}</p>
                                      <p className="text-sm text-muted-foreground">
                                        {item.code} - {item.description}
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        onClick={() => handlePreview(item.sample_link)}
                                        disabled={!item.sample_link}
                                      >
                                        <Eye className="h-4 w-4" />
                                        <span className="sr-only">Preview</span>
                                      </Button>
                                      <Button
                                        type="button"
                                        onClick={() => handleAddItem(item)}
                                        disabled={fields.some((field) => field.id === item.id)}
                                      >
                                        Add
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                  </Accordion>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-1 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Your Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="clinicName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Clinic Name</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            const selectedClinic = clinicOptions.find((c) => c.name === value)
                            field.onChange(value)
                            form.setValue("clinicAddress", selectedClinic?.address || "")
                          }}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a clinic" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {clinicOptions.map((clinic, index) => (
                              <SelectItem key={`${clinic.name}-${index}`} value={clinic.name}>
                                {clinic.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="clinicAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Clinic Address</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Clinic Address" disabled />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="contactPerson"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Your Name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g. Jane Doe" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="contactEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Your Email</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g. jane.doe@example.com" type="email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {fields.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Your Order</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {fields.map((field, index) => (
                      <div key={field.id} className="p-3 rounded-md border space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold">{field.name}</p>
                            <p className="text-sm text-muted-foreground">{field.code}</p>
                          </div>
                          <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveItem(index)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                        <Controller
                          control={form.control}
                          name={`items.${index}.quantity`}
                          render={({ field: quantityField }) => (
                            <FormItem>
                              <FormLabel>Quantity</FormLabel>
                              <Select onValueChange={quantityField.onChange} defaultValue={quantityField.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select quantity" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {(
                                    brand.sections.flatMap((s) => s.items).find((i) => i.id === field.id)?.quantities ||
                                    []
                                  ).map((q) => (
                                    <SelectItem key={q} value={q}>
                                      {q}
                                    </SelectItem>
                                  ))}
                                  <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        {selectedItems[index]?.quantity === "other" && (
                          <Controller
                            control={form.control}
                            name={`items.${index}.otherQuantity`}
                            render={({ field: otherQuantityField }) => (
                              <FormItem>
                                <FormLabel>Please specify quantity</FormLabel>
                                <FormControl>
                                  <Input {...otherQuantityField} placeholder="e.g., 5 boxes" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}
                      </div>
                    ))}
                  </CardContent>
                  <CardFooter>
                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                      {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Submit Order
                    </Button>
                  </CardFooter>
                </Card>
              )}
            </div>
          </div>
        </form>
      </Form>
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl h-[90vh]">
          <DialogHeader>
            <DialogTitle>PDF Preview</DialogTitle>
            <DialogDescription>This is a sample of the selected item.</DialogDescription>
          </DialogHeader>
          <div className="h-full w-full">
            {previewUrl && <iframe src={previewUrl} className="w-full h-full border-0" title="PDF Preview" />}
          </div>
          <DialogFooter>
            <Button onClick={() => setIsPreviewOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
