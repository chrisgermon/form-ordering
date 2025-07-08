"use client"

import { useState, useMemo } from "react"
import Image from "next/image"
import { useForm, Controller, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { CalendarIcon, Loader2, Send, CheckCircle, XCircle, ChevronDown, ArrowLeft, Search, X } from "lucide-react"
import { format } from "date-fns"
import { cn, resolveAssetUrl } from "@/lib/utils"
import type { BrandData, ProductItem } from "@/lib/types"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"

const createFormSchema = (brandData: BrandData) => {
  const baseSchema = z.object({
    orderedBy: z.string().min(1, "Ordered by is required."),
    email: z.string().email("A valid email address is required."),
    billTo: z.string().min(1, "Bill to clinic is required."),
    deliverTo: z.string().min(1, "Deliver to clinic is required."),
    date: z.date({ required_error: "A date is required." }),
    items: z.record(z.any()).optional(),
  })

  return baseSchema.superRefine((data, ctx) => {
    let hasItems = false
    brandData.product_sections.forEach((section) => {
      section.product_items.forEach((item) => {
        const value = data.items?.[item.id]
        if (value && value.quantity !== "") {
          hasItems = true
        }

        if (item.is_required) {
          if (!value || value.quantity === "") {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: [`items.${item.id}`],
              message: `${item.name} is required.`,
            })
          }
        }
      })
    })

    if (!hasItems) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["items"],
        message: "Please select at least one item to order.",
      })
    }
  })
}

const FormField = ({
  item,
  control,
  getValues,
  setValue,
  errors,
}: {
  item: ProductItem
  control: any
  getValues: any
  setValue: any
  errors: any
}) => {
  const fieldName = `items.${item.id}`
  const errorMessage = errors?.items?.[item.id]?.message

  const renderField = () => {
    switch (item.field_type) {
      case "checkbox_group":
        const currentItemValue = getValues(fieldName)
        const handleSelect = (quantity: string, checked: boolean) => {
          const currentItems = getValues("items") || {}
          if (checked) {
            setValue(
              "items",
              {
                ...currentItems,
                [item.id]: { quantity, name: item.name, code: item.code },
              },
              { shouldValidate: true, shouldDirty: true },
            )
          } else {
            const { [item.id]: _, ...rest } = currentItems
            setValue("items", rest, { shouldValidate: true, shouldDirty: true })
          }
        }
        const handleCustomQuantityChange = (value: string) => {
          setValue(`${fieldName}.customQuantity`, value, { shouldValidate: true, shouldDirty: true })
        }
        const isOtherSelected = currentItemValue?.quantity === "other"

        return (
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            {item.options.map((quantity) => (
              <div key={quantity} className="flex items-center space-x-2">
                <Checkbox
                  id={`${item.id}-${quantity}`}
                  checked={currentItemValue?.quantity === quantity}
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
                value={currentItemValue?.customQuantity || ""}
                onChange={(e) => handleCustomQuantityChange(e.target.value)}
              />
            )}
          </div>
        )
      case "text":
        return (
          <Controller
            name={`${fieldName}.quantity`}
            control={control}
            defaultValue=""
            render={({ field }) => <Input placeholder={item.placeholder || ""} {...field} />}
          />
        )
      case "textarea":
        return (
          <Controller
            name={`${fieldName}.quantity`}
            control={control}
            defaultValue=""
            render={({ field }) => <Textarea placeholder={item.placeholder || ""} {...field} />}
          />
        )
      case "select":
        return (
          <Controller
            name={`${fieldName}.quantity`}
            control={control}
            defaultValue=""
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger>
                  <SelectValue placeholder={item.placeholder || "Select an option"} />
                </SelectTrigger>
                <SelectContent>
                  {item.options.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        )
      case "date":
        return (
          <Controller
            name={`${fieldName}.quantity`}
            control={control}
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
                    {field.value ? format(field.value, "dd-MM-yyyy") : <span>DD-MM-YYYY</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                </PopoverContent>
              </Popover>
            )}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="py-4 border-b border-gray-300 last:border-b-0">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-1 space-y-1">
          <p className="font-bold text-gray-800">CODE: {item.code}</p>
          <p className="font-semibold text-gray-700">
            {item.name} {item.is_required && <span className="text-red-500">*</span>}
          </p>
          {item.description && <p className="text-sm text-gray-600">DESCRIPTION: {item.description}</p>}
          {item.sample_link && (
            <a
              href={resolveAssetUrl(item.sample_link)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-1 px-3 py-1 bg-sky-500 text-white text-xs rounded-lg hover:bg-sky-600"
            >
              CHECK HERE
            </a>
          )}
        </div>
        <div className="md:col-span-2">
          {renderField()}
          {errorMessage && <p className="text-xs text-red-600 mt-1">{errorMessage}</p>}
        </div>
      </div>
    </div>
  )
}

function SelectionSidebar({
  selectedItems,
  onRemoveItem,
}: {
  selectedItems: any
  onRemoveItem: (itemId: string) => void
}) {
  const items = Object.entries(selectedItems || {}).filter(([_, value]: [string, any]) => value && value.quantity)

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-xl font-semibold text-[#2a3760] mb-4">Current Selection</h3>
      {items.length === 0 ? (
        <p className="text-gray-500 text-sm">No items selected yet.</p>
      ) : (
        <ul className="space-y-3 max-h-[60vh] overflow-y-auto">
          {items.map(([id, item]: [string, any]) => (
            <li key={id} className="border-b pb-3 last:border-b-0">
              <div className="flex justify-between items-start gap-2">
                <div className="flex-1">
                  <p className="font-semibold text-gray-800 leading-tight">{item.name}</p>
                  <p className="text-xs text-gray-500">CODE: {item.code}</p>
                  <p className="text-sm font-bold text-[#1aa7df] mt-1">
                    Qty: {item.quantity === "other" ? item.customQuantity : item.quantity}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-gray-500 hover:text-red-500 shrink-0"
                  onClick={() => onRemoveItem(id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  data,
  isSubmitting,
}: {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  data: any | null
  isSubmitting: boolean
}) {
  if (!data) return null

  const orderItems = Object.values(data.items || {}).filter((item: any) => item && item.quantity)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Confirm Your Order</DialogTitle>
          <DialogDescription>Please review your order details below before submitting.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <h4 className="font-semibold text-gray-800">Delivery Details</h4>
            <div className="p-3 bg-gray-50 rounded-md border border-gray-200 text-sm">
              <p>
                <span className="font-medium">Deliver To:</span> {data.deliverTo?.name || "N/A"}
              </p>
              <p>
                <span className="font-medium">Confirmation Email:</span> {data.email}
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <h4 className="font-semibold text-gray-800">Order Contents</h4>
            <div className="p-3 bg-gray-50 rounded-md border border-gray-200 max-h-60 overflow-y-auto">
              {orderItems.length > 0 ? (
                <ul className="space-y-2">
                  {orderItems.map((item: any) => (
                    <li key={item.code} className="flex justify-between text-sm">
                      <span>{item.name}</span>
                      <span className="font-bold">
                        {item.quantity === "other" ? item.customQuantity : item.quantity}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">No items in this order.</p>
              )}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Confirm & Submit"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Helper to check if clinic data is in the old string[] format
const isLegacyClinicData = (locations: any): locations is string[] => {
  return Array.isArray(locations) && locations.length > 0 && typeof locations[0] === "string"
}

export function OrderForm({ brandData }: { brandData: BrandData }) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submissionStatus, setSubmissionStatus] = useState<"success" | "error" | null>(null)
  const [submissionMessage, setSubmissionMessage] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [isConfirming, setIsConfirming] = useState(false)
  const [confirmationData, setConfirmationData] = useState<any | null>(null)

  const formSchema = useMemo(() => createFormSchema(brandData), [brandData])

  const {
    register,
    handleSubmit,
    control,
    reset,
    getValues,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: {
      orderedBy: "",
      email: "",
      billTo: "",
      deliverTo: "",
      items: {},
      date: new Date(),
    },
  })

  const onInvalid = (errors: any) => {
    console.error("Form validation errors:", errors)
    setSubmissionStatus("error")
    setSubmissionMessage("Please review the form and fix any errors highlighted in red.")
  }

  const watchedItems = useWatch({ control, name: "items" })

  const clinicLocations = useMemo(() => {
    if (isLegacyClinicData(brandData.clinic_locations)) {
      return brandData.clinic_locations.map((name) => ({ name, address: "", phone: "" }))
    }
    return brandData.clinic_locations || []
  }, [brandData.clinic_locations])

  const handleFormSubmit = (data: any) => {
    const selectedBillTo = clinicLocations.find((loc) => loc.name === data.billTo)
    const selectedDeliverTo = clinicLocations.find((loc) => loc.name === data.deliverTo)

    const payload = {
      ...data,
      billTo: selectedBillTo,
      deliverTo: selectedDeliverTo,
      brandId: brandData.id,
      brandName: brandData.name,
      recipientEmails: brandData.emails,
    }

    setConfirmationData(payload)
    setIsConfirming(true)
  }

  const handleConfirmSubmit = async () => {
    if (!confirmationData) return

    setIsSubmitting(true)
    setSubmissionStatus(null)

    try {
      const response = await fetch("/api/submit-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(confirmationData),
      })

      const result = await response.json()

      if (response.ok) {
        setSubmissionStatus("success")
        setSubmissionMessage("Your order has been submitted successfully!")
        reset()
        setIsConfirming(false)
      } else {
        throw new Error(result.details || result.error || "An unknown error occurred.")
      }
    } catch (error) {
      setSubmissionStatus("error")
      setSubmissionMessage(error instanceof Error ? error.message : "Failed to submit order.")
      setIsConfirming(false)
    } finally {
      setIsSubmitting(false)
      setConfirmationData(null)
    }
  }

  const handleRemoveItem = (itemId: string) => {
    const currentItems = getValues("items") || {}
    const { [itemId]: _, ...rest } = currentItems
    setValue("items", rest, { shouldValidate: true, shouldDirty: true })
  }

  const filteredSections = useMemo(() => {
    if (!searchTerm) {
      return brandData.product_sections
    }
    const lowercasedFilter = searchTerm.toLowerCase()
    return brandData.product_sections
      .map((section) => {
        const filteredItems = section.product_items.filter(
          (item) =>
            item.name.toLowerCase().includes(lowercasedFilter) || item.code.toLowerCase().includes(lowercasedFilter),
        )
        return { ...section, product_items: filteredItems }
      })
      .filter((section) => section.product_items.length > 0)
  }, [searchTerm, brandData.product_sections])

  return (
    <div className="min-h-screen bg-[#f9f9f9] p-4 sm:p-6 md:p-8 font-work-sans">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Button asChild variant="outline" className="bg-white">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to All Forms
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 items-start">
          <div className="flex-grow space-y-8">
            <div className="text-center">
              {brandData.logo && (
                <Image
                  src={resolveAssetUrl(brandData.logo) || "/placeholder.svg"}
                  alt={`${brandData.name} Logo`}
                  width={331}
                  height={98}
                  className="mx-auto object-contain"
                  priority
                  crossOrigin="anonymous"
                />
              )}
            </div>

            <div className="bg-white rounded-xl shadow-lg">
              <div className="bg-[#2a3760] text-white text-center py-4 rounded-t-xl">
                <h1 className="text-2xl font-semibold">Printing Order Form</h1>
              </div>

              <form onSubmit={handleSubmit(handleFormSubmit, onInvalid)} className="p-6 sm:p-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 mb-8">
                  <div className="space-y-1">
                    <label htmlFor="orderedBy" className="text-sm font-medium text-gray-800">
                      Ordered By: <span className="text-red-500">*</span>
                    </label>
                    <Input id="orderedBy" {...register("orderedBy")} className="bg-gray-100 border-gray-300" />
                    {errors.orderedBy && <p className="text-xs text-red-600">{errors.orderedBy.message}</p>}
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="email" className="text-sm font-medium text-gray-800">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <Input id="email" type="email" {...register("email")} className="bg-gray-100 border-gray-300" />
                    {errors.email && <p className="text-xs text-red-600">{errors.email.message}</p>}
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="billTo" className="text-sm font-medium text-gray-800">
                      Bill to Clinic: <span className="text-red-500">*</span>
                    </label>
                    <Controller
                      name="billTo"
                      control={control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger id="billTo" className="bg-gray-100 border-gray-300">
                            <SelectValue placeholder="Select a clinic" />
                          </SelectTrigger>
                          <SelectContent>
                            {clinicLocations.map((location) => (
                              <SelectItem key={location.name} value={location.name}>
                                {location.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.billTo && <p className="text-xs text-red-600">{errors.billTo.message}</p>}
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="deliverTo" className="text-sm font-medium text-gray-800">
                      Deliver to Clinic: <span className="text-red-500">*</span>
                    </label>
                    <Controller
                      name="deliverTo"
                      control={control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger id="deliverTo" className="bg-gray-100 border-gray-300">
                            <SelectValue placeholder="Select a clinic" />
                          </SelectTrigger>
                          <SelectContent>
                            {clinicLocations.map((location) => (
                              <SelectItem key={location.name} value={location.name}>
                                {location.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.deliverTo && <p className="text-xs text-red-600">{errors.deliverTo.message}</p>}
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <label htmlFor="date" className="text-sm font-medium text-gray-800">
                      Date: <span className="text-red-500">*</span>
                    </label>
                    <Controller
                      name="date"
                      control={control}
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
                              {field.value ? format(field.value, "dd-MM-yyyy") : <span>DD-MM-YYYY</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                          </PopoverContent>
                        </Popover>
                      )}
                    />
                    {errors.date && <p className="text-xs text-red-600">{errors.date.message}</p>}
                  </div>
                </div>

                <div className="relative mb-6">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search by item name or code..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-gray-100 border-gray-300"
                  />
                </div>

                <div className="space-y-4">
                  {filteredSections.map((section) => (
                    <Collapsible key={section.id} className="border border-dashed border-[#293563] rounded-lg">
                      <CollapsibleTrigger className="w-full p-4 flex justify-between items-center group hover:bg-gray-50 rounded-t-lg">
                        <h2 className="text-lg font-semibold text-[#1aa7df]">{section.title}</h2>
                        <ChevronDown className="h-5 w-5 text-gray-500 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="p-4 pt-0">
                          <div className="space-y-4">
                            {section.product_items.map((item) => (
                              <FormField
                                key={item.id}
                                item={item}
                                control={control}
                                getValues={getValues}
                                setValue={setValue}
                                errors={errors}
                              />
                            ))}
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  ))}
                </div>
                <div className="mt-8">
                  {submissionStatus === "error" && (
                    <Alert variant="destructive">
                      <XCircle className="h-4 w-4" />
                      <AlertDescription>{submissionMessage}</AlertDescription>
                    </Alert>
                  )}
                  {submissionStatus === "success" && !isConfirming && (
                    <Alert variant="default" className="border-green-500 text-green-700">
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>{submissionMessage}</AlertDescription>
                    </Alert>
                  )}
                </div>

                <div className="flex justify-center mt-8 pt-6">
                  <Button
                    type="submit"
                    className="bg-[#2a3760] hover:bg-[#2a3760]/90 text-white font-semibold px-12 py-6 text-base"
                  >
                    <Send className="mr-2 h-4 w-4" />
                    Submit
                  </Button>
                </div>
              </form>
            </div>
          </div>

          <aside className="hidden lg:block sticky top-8">
            <SelectionSidebar selectedItems={watchedItems} onRemoveItem={handleRemoveItem} />
          </aside>
        </div>
      </div>
      <ConfirmationDialog
        isOpen={isConfirming}
        onClose={() => setIsConfirming(false)}
        onConfirm={handleConfirmSubmit}
        data={confirmationData}
        isSubmitting={isSubmitting}
      />
    </div>
  )
}
