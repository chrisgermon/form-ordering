"use client"

import { useState, type FormEvent } from "react"
import Image from "next/image"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import type { BrandWithSectionsAndItems, ProductItem, ProductSection } from "@/lib/types"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"

type OrderFormProps = {
  brand: BrandWithSectionsAndItems
}

type SelectedItems = {
  [itemId: string]: {
    id: string
    code: string
    name: string
    quantity: string
    customQuantity?: string
    description?: string | null
  }
}

export default function OrderForm({ brand }: OrderFormProps) {
  const { toast } = useToast()
  const [selectedItems, setSelectedItems] = useState<SelectedItems>({})
  const [isLoading, setIsLoading] = useState(false)
  const [date, setDate] = useState<Date | undefined>(new Date())

  const handleItemSelection = (item: ProductItem, checked: boolean) => {
    setSelectedItems((prev) => {
      const newItems = { ...prev }
      if (checked) {
        newItems[item.id] = {
          id: item.id,
          code: item.code,
          name: item.name,
          quantity: item.quantities?.[0] || "1",
          description: item.description,
        }
      } else {
        delete newItems[item.id]
      }
      return newItems
    })
  }

  const handleQuantityChange = (itemId: string, value: string) => {
    setSelectedItems((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], quantity: value },
    }))
  }

  const handleCustomQuantityChange = (itemId: string, value: string) => {
    setSelectedItems((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], customQuantity: value },
    }))
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    const formValues = Object.fromEntries(formData.entries())

    const orderData = {
      ...formValues,
      date: date ? format(date, "yyyy-MM-dd") : null,
      items: selectedItems,
      brandId: brand.id,
      brandName: brand.name,
      brandEmail: brand.email,
    }

    try {
      const response = await fetch("/api/submit-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Order Submitted!",
          description: "Your order has been sent successfully.",
        })
        setSelectedItems({})
        e.currentTarget.reset()
        setDate(new Date())
      } else {
        throw new Error(result.message || "An unknown error occurred.")
      }
    } catch (error) {
      console.error("Submission error:", error)
      toast({
        title: "Submission Failed",
        description: error instanceof Error ? error.message : "Could not submit your order. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const primaryColor = brand.primary_color || "#000000"
  const totalSelected = Object.keys(selectedItems).length
  const defaultOpenAccordion = brand.product_sections?.map((s) => s.id.toString()) || []

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4">
      <Card className="overflow-hidden">
        <CardHeader className="p-6 text-white" style={{ backgroundColor: primaryColor }}>
          <div className="flex items-center gap-4">
            {brand.logo && (
              <Image
                src={brand.logo || "/placeholder.svg"}
                alt={`${brand.name} Logo`}
                width={80}
                height={80}
                className="rounded-md bg-white p-1 object-contain"
              />
            )}
            <div>
              <CardTitle className="text-3xl font-bold">{brand.name}</CardTitle>
              <p className="text-lg">Printing Order Form</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="space-y-2">
                <Label htmlFor="orderedBy">Ordered By</Label>
                <Input id="orderedBy" name="orderedBy" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="billTo">Bill to Clinic</Label>
                <Select name="billTo" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a clinic" />
                  </SelectTrigger>
                  <SelectContent>
                    {brand.clinics?.map((clinic) => (
                      <SelectItem key={clinic} value={clinic}>
                        {clinic}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="deliverTo">Deliver to Clinic</Label>
                <Select name="deliverTo" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a clinic" />
                  </SelectTrigger>
                  <SelectContent>
                    {brand.clinics?.map((clinic) => (
                      <SelectItem key={clinic} value={clinic}>
                        {clinic}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <h3 className="text-xl font-semibold mb-4 border-b pb-2">Products</h3>
            <Accordion type="multiple" className="w-full" defaultValue={defaultOpenAccordion}>
              {brand.product_sections
                ?.sort((a, b) => a.sort_order - b.sort_order)
                .map((section: ProductSection) => (
                  <AccordionItem key={section.id} value={section.id.toString()}>
                    <AccordionTrigger className="text-lg font-medium">{section.title}</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4">
                        {section.product_items
                          ?.sort((a, b) => a.sort_order - b.sort_order)
                          .map((item: ProductItem) => (
                            <div key={item.id} className="flex items-start gap-4 p-3 border rounded-md">
                              <Checkbox
                                id={`item-${item.id}`}
                                checked={!!selectedItems[item.id]}
                                onCheckedChange={(checked) => handleItemSelection(item, !!checked)}
                                className="mt-1"
                              />
                              <div className="flex-1 grid gap-2">
                                <label htmlFor={`item-${item.id}`} className="font-semibold">
                                  {item.name}{" "}
                                  <span className="text-sm text-muted-foreground font-mono">({item.code})</span>
                                </label>
                                {item.description && (
                                  <p className="text-sm text-muted-foreground">{item.description}</p>
                                )}
                                {item.sample_link && (
                                  <a
                                    href={item.sample_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-blue-600 hover:underline"
                                  >
                                    View Sample
                                  </a>
                                )}
                                {selectedItems[item.id] && (
                                  <div className="flex items-center gap-2 mt-2">
                                    <Label htmlFor={`quantity-${item.id}`} className="text-sm">
                                      Quantity:
                                    </Label>
                                    <Select
                                      value={selectedItems[item.id].quantity}
                                      onValueChange={(value) => handleQuantityChange(item.id, value)}
                                    >
                                      <SelectTrigger className="w-[120px]">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {item.quantities?.map((q) => (
                                          <SelectItem key={q} value={q}>
                                            {q}
                                          </SelectItem>
                                        ))}
                                        <SelectItem value="other">Other</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    {selectedItems[item.id].quantity === "other" && (
                                      <Input
                                        type="text"
                                        placeholder="Specify"
                                        className="w-[100px]"
                                        value={selectedItems[item.id].customQuantity || ""}
                                        onChange={(e) => handleCustomQuantityChange(item.id, e.target.value)}
                                        required
                                      />
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
            </Accordion>

            <div className="mt-8 pt-6 border-t flex justify-end items-center gap-4">
              <p className="text-muted-foreground">{totalSelected} item(s) selected</p>
              <Button type="submit" disabled={isLoading || totalSelected === 0} size="lg">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit Order
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
