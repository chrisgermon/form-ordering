"use client"
import { useState, useMemo } from "react"
import { useForm, Controller, FormProvider, useFormContext } from "react-hook-form"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CalendarIcon, Loader2, Send, CheckCircle, XCircle } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import type { BrandData, ProductItem } from "@/lib/types"
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
  const { control, setValue, watch, register } = useFormContext<FormValues>()
  const itemState = watch(`items.${item.id}`)
  const selectedQuantity = itemState?.quantity

  const handleSelect = (quantity: string, checked: boolean) => {
    if (checked) {
      setValue(`items.${item.id}.quantity`, quantity, { shouldValidate: true })
    } else if (selectedQuantity === quantity) {
      setValue(`items.${item.id}.quantity`, undefined, { shouldValidate: true })
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

export function OrderForm({ brandData }: { brandData: BrandData }) {
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
    formState: { errors },
  } = methods

  const clinicLocations = [
    "Botanic Ridge",
    "Bulleen",
    "Carnegie",
    "Coburg",
    "Diamond Creek",
    "Greensborough",
    "Hampton East",
    "Kangaroo Flat",
    "Kyabram",
    "Lilydale",
    "Lynbrook",
    "Mentone",
    "Mornington",
    "Mulgrave",
    "North Melbourne",
    "Reservoir",
    "Sebastopol",
    "Shepparton",
    "Thornbury",
    "Torquay",
    "Werribee",
    "Williamstown",
  ]

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
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
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
          </div>

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
                  <Controller
                    name="orderedBy"
                    control={control}
                    rules={{ required: "Ordered By is required." }}
                    render={({ field }) => <Input {...field} id="orderedBy" className="bg-gray-100 border-gray-300" />}
                  />
                  {errors.orderedBy && <p className="text-xs text-red-500">{errors.orderedBy.message}</p>}
                </div>
                <div className="space-y-1">
                  <label htmlFor="email" className="text-sm font-medium text-gray-800">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <Controller
                    name="email"
                    control={control}
                    rules={{
                      required: "Email is required.",
                      pattern: { value: /^\S+@\S+$/i, message: "Invalid email address." },
                    }}
                    render={({ field }) => (
                      <Input {...field} id="email" type="email" className="bg-gray-100 border-gray-300" />
                    )}
                  />
                  {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
                </div>
                <div className="space-y-1">
                  <label htmlFor="billTo" className="text-sm font-medium text-gray-800">
                    Bill to Clinic: <span className="text-red-500">*</span>
                  </label>
                  <Controller
                    name="billTo"
                    control={control}
                    rules={{ required: "Please select a clinic to bill." }}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
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
                    )}
                  />
                  {errors.billTo && <p className="text-xs text-red-500">{errors.billTo.message}</p>}
                </div>
                <div className="space-y-1">
                  <label htmlFor="deliverTo" className="text-sm font-medium text-gray-800">
                    Deliver to Clinic: <span className="text-red-500">*</span>
                  </label>
                  <Controller
                    name="deliverTo"
                    control={control}
                    rules={{ required: "Please select a delivery clinic." }}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
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
                    )}
                  />
                  {errors.deliverTo && <p className="text-xs text-red-500">{errors.deliverTo.message}</p>}
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <label htmlFor="date" className="text-sm font-medium text-gray-800">
                    Date: <span className="text-red-500">*</span>
                  </label>
                  <Controller
                    name="date"
                    control={control}
                    rules={{ required: "Date is required." }}
                    render={({ field }) => (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full justify-start text-left font-normal bg-gray-100 border-gray-300",
                              !field.value && "text-muted-foreground",
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                        </PopoverContent>
                      </Popover>
                    )}
                  />
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
                    submissionStatus === "success" ? "border-green-500 text-green-700" : "border-red-500 text-red-700",
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
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                  Submit
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </FormProvider>
  )
}
