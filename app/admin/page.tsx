"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useForm, Controller } from "react-hook-form"
import { format } from "date-fns"
import type { DateRange } from "react-day-picker"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  Trash2,
  Plus,
  Download,
  Loader2,
  CalendarIcon,
  ClipboardCopy,
  CalendarIcon as CalendarIconFilter,
} from "lucide-react"
import { Alert } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { scrapeClinicsFromWebsite } from "./actions"
import type { Brand, UploadedFile, Submission, Clinic } from "@/lib/types"
import { Textarea } from "@/components/ui/textarea"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/server"
import { MarkAsCompleteButton, RefreshButton } from "./admin-components"

function DatePickerWithRange({
  className,
  date,
  setDate,
}: {
  className?: string
  date: DateRange | undefined
  setDate: (date: DateRange | undefined) => void
}) {
  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
          >
            <CalendarIconFilter className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd, y")} - {format(date.to, "LLL dd, y")}
                </>
              ) : (
                format(date.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={setDate}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}

export const dynamic = "force-dynamic"

export default async function AdminPage() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("submissions")
    .select("*, brand:brands(name)")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching submissions:", error)
  }

  const submissions = data || []

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <div className="flex items-center space-x-4">
            <RefreshButton />
            <Link href="/admin/brands">
              <Button>Manage Brands</Button>
            </Link>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Order Submissions</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">A list of all the print orders submitted.</p>
            </div>
            <div className="border-t border-gray-200">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order #</TableHead>
                    <TableHead>Brand</TableHead>
                    <TableHead>Ordered By</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions.map((submission) => (
                    <TableRow key={submission.id}>
                      <TableCell className="font-medium">{submission.order_number}</TableCell>
                      <TableCell>{submission.brand?.name}</TableCell>
                      <TableCell>{submission.ordered_by}</TableCell>
                      <TableCell>{format(new Date(submission.created_at), "dd/MM/yyyy")}</TableCell>
                      <TableCell>
                        <Badge
                          variant={submission.status === "completed" ? "default" : "secondary"}
                          className={submission.status === "completed" ? "bg-green-100 text-green-800" : ""}
                        >
                          {submission.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {submission.status !== "completed" && <MarkAsCompleteButton submission={submission} />}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

function BrandForm({
  brand,
  uploadedFiles,
  onSave,
  onCancel,
}: {
  brand: Brand | null
  uploadedFiles: UploadedFile[]
  onSave: (brand: any) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState({
    id: brand?.id || undefined,
    name: brand?.name || "",
    initials: brand?.initials || "",
    logo: brand?.logo || "",
    email: brand?.email || "",
    active: brand?.active ?? true,
  })
  const [clinics, setClinics] = useState<Clinic[]>(brand?.clinics || [])
  const [websiteUrl, setWebsiteUrl] = useState("")
  const [isScraping, setIsScraping] = useState(false)
  const [scrapingError, setScrapingError] = useState<string | null>(null)

  useEffect(() => {
    if (brand) {
      setFormData({
        id: brand.id,
        name: brand.name,
        initials: brand.initials || "",
        logo: brand.logo || "",
        email: brand.email,
        active: brand.active,
      })
      setClinics(brand.clinics || [])
    } else {
      setFormData({
        id: undefined,
        name: "",
        initials: "",
        logo: "",
        email: "",
        active: true,
      })
      setClinics([])
    }
  }, [brand])

  const handleClinicChange = (index: number, field: "name" | "address", value: string) => {
    const newClinics = [...clinics]
    newClinics[index] = { ...newClinics[index], [field]: value }
    setClinics(newClinics)
  }

  const addClinic = () => {
    setClinics([...clinics, { name: "", address: "" }])
  }

  const removeClinic = (index: number) => {
    const newClinics = clinics.filter((_, i) => i !== index)
    setClinics(newClinics)
  }

  const handleScrape = async () => {
    setIsScraping(true)
    setScrapingError(null)
    const result = await scrapeClinicsFromWebsite(websiteUrl)
    if (result.error) {
      setScrapingError(result.error)
    } else if (result.clinics) {
      const existingClinics = new Set(clinics.map((c) => `${c.name.trim()}|${c.address.trim()}`))
      const newClinics = result.clinics.filter((scrapedClinic) => {
        const key = `${scrapedClinic.name.trim()}|${scrapedClinic.address.trim()}`
        return !existingClinics.has(key)
      })
      setClinics((prev) => [...prev, ...newClinics])
    }
    setIsScraping(false)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const filteredClinics = clinics.filter((c) => c.name.trim() !== "" && c.address.trim() !== "")
    onSave({ ...formData, clinics: filteredClinics })
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2">
          <Label htmlFor="name">Brand Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="initials">Initials</Label>
          <Input
            id="initials"
            placeholder="e.g., FR"
            value={formData.initials}
            onChange={(e) => setFormData({ ...formData, initials: e.target.value.toUpperCase() })}
            required
          />
        </div>
      </div>
      <div>
        <Label htmlFor="email">Recipient Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="orders@example.com"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
        />
      </div>
      <div>
        <Label htmlFor="logo">Logo URL</Label>
        <Select
          value={formData.logo || ""}
          onValueChange={(value) => setFormData({ ...formData, logo: value === "none" ? "" : value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select an uploaded logo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No logo</SelectItem>
            {Array.isArray(uploadedFiles) &&
              uploadedFiles.map((file) => (
                <SelectItem key={file.id} value={file.url}>
                  {file.original_name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
        <Input
          className="mt-2"
          placeholder="Or enter custom URL"
          value={formData.logo || ""}
          onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
        />
      </div>
      <div>
        <Label>Scrape Clinic Locations from Website</Label>
        <div className="flex items-center gap-2 mt-1">
          <Input
            type="url"
            placeholder="https://www.example.com/locations"
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
          />
          <Button type="button" onClick={handleScrape} disabled={isScraping || !websiteUrl}>
            {isScraping ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Scrape"}
          </Button>
        </div>
        {scrapingError && <p className="text-sm text-red-500 mt-1">{scrapingError}</p>}
      </div>
      <div>
        <Label>Clinic Locations</Label>
        <div className="space-y-3 rounded-md border p-4 max-h-60 overflow-y-auto">
          {clinics.map((clinic, index) => (
            <div key={index} className="grid grid-cols-1 gap-2 sm:grid-cols-10 sm:gap-4">
              <div className="sm:col-span-4">
                <Label htmlFor={`clinic-name-${index}`} className="text-xs text-muted-foreground">
                  Name
                </Label>
                <Input
                  id={`clinic-name-${index}`}
                  placeholder="e.g., Botanic Ridge"
                  value={clinic.name}
                  onChange={(e) => handleClinicChange(index, "name", e.target.value)}
                />
              </div>
              <div className="sm:col-span-5">
                <Label htmlFor={`clinic-address-${index}`} className="text-xs text-muted-foreground">
                  Address
                </Label>
                <Textarea
                  id={`clinic-address-${index}`}
                  placeholder="123 Main St, Suburb VIC 3000"
                  value={clinic.address}
                  onChange={(e) => handleClinicChange(index, "address", e.target.value)}
                  rows={1}
                  className="min-h-[40px]"
                />
              </div>
              <div className="flex items-end sm:col-span-1">
                <Button type="button" variant="ghost" size="icon" onClick={() => removeClinic(index)}>
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            </div>
          ))}
          {clinics.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No clinics added. Use the scraper above or add one manually.
            </p>
          )}
          <Button type="button" variant="secondary" onClick={addClinic} className="mt-2">
            <Plus className="mr-2 h-4 w-4" /> Add Clinic Manually
          </Button>
        </div>
      </div>
      <div className="flex items-center space-x-2 pt-2">
        <input
          type="checkbox"
          id="active"
          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          checked={formData.active}
          onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
        />
        <Label htmlFor="active" className="font-medium">
          Active
        </Label>
      </div>
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Save</Button>
      </div>
    </form>
  )
}

function CompleteSubmissionDialog({
  open,
  onOpenChange,
  submission,
  onCompleted,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  submission: Submission | null
  onCompleted: () => void
}) {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      delivery_details: "",
      expected_delivery_date: new Date(),
    },
  })
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  useEffect(() => {
    if (open) {
      reset({
        delivery_details: "",
        expected_delivery_date: new Date(),
      })
      setErrorMessage("")
    }
  }, [open, reset])

  const onSubmit = async (data: any) => {
    if (!submission) return
    setIsSaving(true)
    setErrorMessage("")
    try {
      const response = await fetch(`/api/admin/submissions/${submission.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          delivery_details: data.delivery_details,
          expected_delivery_date: data.expected_delivery_date
            ? format(data.expected_delivery_date, "yyyy-MM-dd")
            : null,
        }),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update submission.")
      }
      onCompleted()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "An unknown error occurred.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mark Order as Complete</DialogTitle>
          <DialogDescription>Add delivery details for order {submission?.order_number}.</DialogDescription>
        </DialogHeader>
        {submission && (
          <div className="text-sm text-muted-foreground border-y py-4 my-4">
            <p>
              <strong>Order #:</strong> {submission.order_number}
            </p>
            <p>
              <strong>Brand:</strong> {submission.brand_name}
            </p>
            <p>
              <strong>Ordered By:</strong> {submission.ordered_by} ({submission.email})
            </p>
          </div>
        )}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="delivery_details">Delivery Details (Courier, Tracking #, etc.)</Label>
            <Controller
              name="delivery_details"
              control={control}
              render={({ field }) => <Textarea id="delivery_details" {...field} />}
            />
          </div>
          <div>
            <Label htmlFor="expected_delivery_date">Expected Delivery Date</Label>
            <Controller
              name="expected_delivery_date"
              control={control}
              rules={{ required: "Delivery date is required." }}
              render={({ field }) => (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
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
            {errors.expected_delivery_date && (
              <p className="text-xs text-red-500 mt-1">{errors.expected_delivery_date.message}</p>
            )}
          </div>
          {errorMessage && <Alert variant="destructive">{errorMessage}</Alert>}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save and Complete
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function SubmissionDetailsDialog({
  submission,
  open,
  onOpenChange,
}: {
  submission: Submission | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  if (!submission) return null

  const orderedItems = Object.values(submission.items || {})

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Order Details: {submission.order_number}</DialogTitle>
          <DialogDescription>
            A complete summary of the order submitted on{" "}
            {new Date(submission.created_at).toLocaleString("en-AU", {
              dateStyle: "full",
              timeStyle: "short",
            })}
            .
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 max-h-[70vh] overflow-y-auto pr-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Order Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="font-semibold text-gray-600">Brand:</span>
                <span>{submission.brand_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-gray-600">Status:</span>
                <Badge
                  variant={
                    submission.status === "sent"
                      ? "default"
                      : submission.status === "failed"
                        ? "destructive"
                        : submission.status === "completed"
                          ? "success"
                          : "secondary"
                  }
                  className="capitalize"
                >
                  {submission.status}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-gray-600">PDF:</span>
                <a
                  href={submission.pdf_url || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline flex items-center gap-1"
                >
                  <Download className="h-3 w-3" />
                  Download
                </a>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Submitter Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="font-semibold text-gray-600">Ordered By:</span>
                <span>{submission.ordered_by}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-600">Email:</span>
                <div className="flex items-center gap-2">
                  <span>{submission.email}</span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    onClick={() => copyToClipboard(submission.email)}
                  >
                    <ClipboardCopy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-gray-600">IP Address:</span>
                <span>{submission.ip_address || "N/A"}</span>
              </div>
            </CardContent>
          </Card>
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Clinic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="font-semibold text-gray-600">Deliver To:</span>
                <span className="text-right whitespace-pre-wrap">{submission.deliver_to}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-gray-600">Bill To:</span>
                <span>{submission.bill_to}</span>
              </div>
            </CardContent>
          </Card>
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Ordered Items ({orderedItems.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Quantity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orderedItems.map((item: any, index: number) => (
                    <TableRow key={item.code || index}>
                      <TableCell className="font-mono text-xs">{item.code}</TableCell>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.quantity === "other" ? item.customQuantity || "N/A" : item.quantity}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
        <div className="flex justify-end pt-4">
          <DialogClose asChild>
            <Button variant="outline">Close</Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  )
}
