"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, CalendarIcon } from "lucide-react"
import { Alert } from "@/components/ui/alert"
import type { Brand, UploadedFile, Submission } from "@/lib/types"
import { Textarea } from "@/components/ui/textarea"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import AdminDashboard from "./AdminDashboard"
import { createServerSupabaseClient } from "@/lib/supabase"

// This forces the page to be re-rendered on every request, ensuring fresh data.
export const dynamic = "force-dynamic"

// This is now a pure Server Component. It fetches data and passes it to the client.
export default async function AdminPage() {
  const supabase = createServerSupabaseClient()

  // Fetch initial data on the server
  const { data: brands, error: brandsError } = await supabase.from("brands").select("*").order("name")

  const { data: submissions, error: submissionsError } = await supabase
    .from("submissions")
    .select("*, brands(name)")
    .order("created_at", { ascending: false })

  // Handle errors gracefully
  if (brandsError) {
    return <p className="text-red-500 p-8">Error loading brands: {brandsError.message}</p>
  }
  if (submissionsError) {
    return <p className="text-red-500 p-8">Error loading submissions: {submissionsError.message}</p>
  }

  // Format submissions data on the server
  const formattedSubmissions =
    submissions?.map((s: any) => ({
      ...s,
      brand_name: s.brands?.name || "Unknown Brand",
    })) || []

  // Pass server-fetched data to the client component
  return (
    <AdminDashboard
      initialBrands={brands as Brand[]}
      initialSubmissions={formattedSubmissions as (Submission & { brand_name: string })[]}
    />
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
    logo: brand?.logo || "",
    primaryColor: brand?.primary_color || "",
    email: brand?.email || "",
    active: brand?.active ?? true,
  })
  const [clinicsText, setClinicsText] = useState(brand?.clinics?.join("\n") || "")

  useEffect(() => {
    if (brand) {
      setFormData({
        id: brand.id,
        name: brand.name,
        logo: brand.logo || "",
        primaryColor: brand.primary_color || "",
        email: brand.email,
        active: brand.active,
      })
      setClinicsText(brand.clinics?.join("\n") || "")
    } else {
      setFormData({
        id: undefined,
        name: "",
        logo: "",
        primaryColor: "",
        email: "",
        active: true,
      })
      setClinicsText("")
    }
  }, [brand])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const clinicsArray = clinicsText
      .split("\n")
      .map((c) => c.trim())
      .filter(Boolean)
    onSave({ ...formData, clinics: clinicsArray })
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <Label htmlFor="name">Brand Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>
      <div>
        <Label htmlFor="primaryColor">Primary Color</Label>
        <Input
          id="primaryColor"
          placeholder="e.g., #007bff or a Tailwind color"
          value={formData.primaryColor}
          onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
        />
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
          value={formData.logo}
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
          value={formData.logo}
          onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="clinics">Clinic Locations (one per line)</Label>
        <Textarea
          id="clinics"
          value={clinicsText}
          onChange={(e) => setClinicsText(e.target.value)}
          rows={6}
          placeholder={"Botanic Ridge\nBulleen\nCarnegie"}
        />
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
        </DialogHeader>
        {submission && (
          <div className="text-sm text-muted-foreground border-b pb-4">
            <p>
              <strong>Order ID:</strong> {submission.id.substring(0, 8)}...
            </p>
            <p>
              <strong>Brand:</strong> {submission.brand_name}
            </p>
            <p>
              <strong>Ordered By:</strong> {submission.ordered_by} ({submission.email})
            </p>
          </div>
        )}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
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
