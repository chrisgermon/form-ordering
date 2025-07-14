"use client"
import { useState, useMemo } from "react"
import { useForm, FormProvider, useFormContext, useWatch } from "react-hook-form"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CalendarIcon, Loader2, Send, CheckCircle, XCircle, ArrowLeft } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import type { Brand, ProductItem } from "@/lib/types"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface FormValues {
  orderedBy: string
  email: string
  billTo: string
  deliverTo: string
  date?: Date
  items: Record<string, { quantity?: string; customQuantity?: string }>
}

const ItemRow = ({ item }: { item: ProductItem }) => {
  const { setValue, watch, register } = useFormContext<FormValues>()
  const itemState = watch(`items.${item.id}`)
  const selectedQuantity = itemState?.quantity

  const handleSelect = (quantity: string, checked: boolean) => {
    if (checked) {
      setValue(`items.${item.id}.quantity`, quantity, { shouldValidate: true })
    } else if (selectedQuantity === quantity) {
      setValue(`items.${item.id}.quantity`, undefined, { shouldValidate: true })
      setValue(`items.${item.id}.customQuantity`, "", { shouldValidate: true })
    }
  }

  const isOtherSelected = selectedQuantity === "other"

  return (
    <div className="py-4 border-b border-gray-300 last:border-b-0">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-1 space-y-1">
          <p className="font-bold text-gray-800">CODE: {item.code}</p>
          <p className="font-semibold text-gray-700">ITEM: {item.name}</p>
          {item.description && <p className="text-sm text-gray-600">DESCRIPTION: {item.description}</p>}
          {item.sample_link && (
            <a
              href={item.sample_link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-1 px-3 py-1 bg-sky-500 text-white text-xs rounded-lg hover:bg-sky-600"
            >
              CHECK HERE
            </a>
          )}
        </div>
        <div className="md:col-span-2 flex flex-wrap items-center gap-x-6 gap-y-2">
          {item.quantities.map((quantity) => (
            <div key={quantity} className="flex items-center space-x-2">
              <Checkbox
                id={`${item.id}-${quantity}`}
                checked={selectedQuantity === quantity}
                onCheckedChange={(checked) => handleSelect(quantity, !!checked)}
              />
              <label htmlFor={`${item.id}-${quantity}`} className="text-sm font-medium text-gray-700">
                {quantity}
              </label>
            </div>
          ))}
          {isOtherSelected && (
            <Input
              type="text"
              placeholder="Enter quantity"
              className="h-8 w-40 border-gray-400"
              {...register(`items.${item.id}.customQuantity`)}
            />
          )}
        </div>
      </div>
    </div>
  )
}

function OrderSummary({ allItemsMap }: { allItemsMap: Map<string, ProductItem> }) {
  const { control } = useFormContext<FormValues>()
  const selectedItems = useWatch({
    control,
    name: "items",
  })

  const itemsToDisplay = useMemo(() => {
    if (!selectedItems) return []
    return Object.entries(selectedItems)
      .map(([id, data]) => {
        if (data && data.quantity) {
          const details = allItemsMap.get(id)
          if (details) {
            return {
              ...details,
              selectedQuantity: data.quantity,
              customQuantity: data.customQuantity,
            }
          }
        }
        return null
      })
      .filter(Boolean) as (ProductItem & { selectedQuantity: string; customQuantity?: string })[]
  }, [selectedItems, allItemsMap])

  return (
    <div className="sticky top-8">
      <div className="bg-white rounded-xl shadow-lg border border-gray-200">
        <div className="bg-gray-100 text-gray-800 text-center py-3 rounded-t-xl border-b">
          <h2 className="text-xl font-semibold">Your Order</h2>
        </div>
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {itemsToDisplay.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">No items selected yet.</p>
          ) : (
            itemsToDisplay.map((item) => (
              <div key={item.id} className="border-b pb-3 last:border-b-0 last:pb-0">
                <p className="font-semibold text-gray-800">{item.name}</p>
                <p className="text-sm text-gray-600">Code: {item.code}</p>
                <p className="text-sm font-medium text-blue-600 mt-1">
                  Quantity: {item.selectedQuantity === "other" ? item.customQuantity || "N/A" : item.selectedQuantity}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export function OrderForm({ brandData }: { brandData: Brand }) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submissionStatus, setSubmissionStatus] = useState<"success" | "error" | null>(null)
  const [submissionMessage, setSubmissionMessage] = useState("")

  const allItemsMap = useMemo(() => {
    const map = new Map<string, ProductItem>()
    brandData.product_sections.forEach((section) => {
      section.product_items.forEach((item) => {
        map.set(item.id, item)
      })
    })
    return map
  }, [brandData])

  const methods = useForm<FormValues>({
    defaultValues: {
      orderedBy: "",
      email: "",
      billTo: "",
      deliverTo: "",
      date: new Date(),
      items: {},
    },
  })

  const {
    control,
    handleSubmit,
    reset,
    register,
    setValue,
    watch,
    formState: { errors },
  } = methods

  const clinicLocations = useMemo(() => brandData.clinics || [], [brandData.clinics])

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true)
    setSubmissionStatus(null)

    const itemsForPayload = Object.entries(data.items || {})
      .filter(([_, value]) => value && value.quantity)
      .reduce((acc, [itemId, itemValue]) => {
        const itemDetails = allItemsMap.get(itemId)
        if (itemDetails) {
          acc[itemId] = {
            quantity: itemValue.quantity,
            customQuantity: itemValue.customQuantity,
            name: itemDetails.name,
            code: itemDetails.code,
            description: itemDetails.description,
          }
        }
        return acc
      }, {} as any)

    if (Object.keys(itemsForPayload).length === 0) {
      setSubmissionStatus("error")
      setSubmissionMessage("Please select at least one item to order.")
      setIsSubmitting(false)
      return
    }

    const payload = {
      brandId: brandData.id,
      brandName: brandData.name,
      brandEmail: brandData.email,
      orderedBy: data.orderedBy,
      email: data.email,
      billTo: data.billTo,
      deliverTo: data.deliverTo,
      date: data.date ? format(data.date, "yyyy-MM-dd") : null,
      items: itemsForPayload,
    }

    try {
      const response = await fetch("/api/submit-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setSubmissionStatus("success")
        setSubmissionMessage("Your order has been submitted successfully!")
        reset()
      } else {
        throw new Error(result.message || "An unknown error occurred.")
      }
    } catch (error) {
      setSubmissionStatus("error")
      setSubmissionMessage(error instanceof Error ? error.message : "Failed to submit order.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <FormProvider {...methods}>
      <div className="min-h-screen bg-[#f9f9f9] p-4 sm:p-6 md:p-8 font-work-sans">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center mb-8">
            <Button variant="outline" onClick={() => router.push("/")} className="mr-auto">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to All Brands
            </Button>
            {brandData.logo && (
              <Image
                src={brandData.logo || "/placeholder.svg"}
                alt={`${brandData.name} Logo`}
                width={331}
                height={98}
                className="mx-auto object-contain"
                priority
              />
            )}
            <div className="w-[188px] mr-auto"></div> {/* Spacer to balance the back button */}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-lg">
                <div className="bg-[#2a3760] text-white text-center py-4 rounded-t-xl">
                  <h1 className="text-2xl font-semibold">Printing Order Form</h1>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="p-6 sm:p-8">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 mb-8">
                    <div className="space-y-1">
                      <label htmlFor="orderedBy" className="text-sm font-medium text-gray-800">
                        Ordered By: <span className="text-red-500">*</span>
                      </label>
                      <Input
                        id="orderedBy"
                        className="bg-gray-100 border-gray-300"
                        {...register("orderedBy", { required: "Ordered By is required." })}
                      />
                      {errors.orderedBy && <p className="text-xs text-red-500">{errors.orderedBy.message}</p>}
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="email" className="text-sm font-medium text-gray-800">
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <Input
                        id="email"
                        type="email"
                        className="bg-gray-100 border-gray-300"
                        {...register("email", {
                          required: "Email is required.",
                          pattern: { value: /^\S+@\S+$/i, message: "Invalid email address." },
                        })}
                      />
                      {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="billTo" className="text-sm font-medium text-gray-800">
                        Bill to Clinic: <span className="text-red-500">*</span>
                      </label>
                      <Select onValueChange={(value) => setValue("billTo", value)} value={watch("billTo")}>
                        <SelectTrigger id="billTo" className="bg-gray-100 border-gray-300">
                          <SelectValue placeholder="Select a clinic" />
                        </SelectTrigger>
                        <SelectContent>
                          {clinicLocations.map((location) => (
                            <SelectItem key={location} value={location}>
                              {location}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.billTo && <p className="text-xs text-red-500">{errors.billTo.message}</p>}
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="deliverTo" className="text-sm font-medium text-gray-800">
                        Deliver to Clinic: <span className="text-red-500">*</span>
                      </label>
                      <Select onValueChange={(value) => setValue("deliverTo", value)} value={watch("deliverTo")}>
                        <SelectTrigger id="deliverTo" className="bg-gray-100 border-gray-300">
                          <SelectValue placeholder="Select a clinic" />
                        </SelectTrigger>
                        <SelectContent>
                          {clinicLocations.map((location) => (
                            <SelectItem key={location} value={location}>
                              {location}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.deliverTo && <p className="text-xs text-red-500">{errors.deliverTo.message}</p>}
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                      <label htmlFor="date" className="text-sm font-medium text-gray-800">
                        Date: <span className="text-red-500">*</span>
                      </label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full justify-start text-left font-normal bg-gray-100 border-gray-300",
                              !watch("date") && "text-muted-foreground",
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {watch("date") ? format(watch("date")!, "PPP") : <span>Pick a date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={watch("date")}
                            onSelect={(date) => setValue("date", date)}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      {errors.date && <p className="text-xs text-red-500">{errors.date.message}</p>}
                    </div>
                  </div>

                  <div className="space-y-8">
                    {brandData.product_sections.map((section) => (
                      <div key={section.id} className="border border-dashed border-[#293563] rounded-lg p-4">
                        <h2 className="text-lg font-semibold text-[#1aa7df] mb-4">{section.title}</h2>
                        <div className="space-y-4">
                          {section.product_items.map((item) => (
                            <ItemRow key={item.id} item={item} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {submissionStatus && (
                    <Alert
                      className={cn(
                        "mt-8",
                        submissionStatus === "success"
                          ? "border-green-500 text-green-700"
                          : "border-red-500 text-red-700",
                      )}
                    >
                      {submissionStatus === "success" ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <XCircle className="h-4 w-4" />
                      )}
                      <AlertDescription>{submissionMessage}</AlertDescription>
                    </Alert>
                  )}

                  <div className="flex justify-center mt-8 pt-6">
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-[#2a3760] hover:bg-[#2a3760]/90 text-white font-semibold px-12 py-6 text-base"
                    >
                      {isSubmitting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="mr-2 h-4 w-4" />
                      )}
                      Submit
                    </Button>
                  </div>
                </form>
              </div>
            </div>
            <div className="lg:col-span-1">
              <OrderSummary allItemsMap={allItemsMap} />
            </div>
          </div>
        </div>
      </div>
    </FormProvider>
  )
}
