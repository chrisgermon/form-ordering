"use client"

import type React from "react"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import AdminDashboard from "./AdminDashboard"
import type { BrandType, SubmissionType, UploadedFileType } from "@/lib/types"
import { redirect } from "next/navigation"
import { Loader2, CalendarIcon } from "lucide-react"
import { Alert } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { useForm } from "react-hook-form"
import { format } from "date-fns"
import { useState, useEffect } from "react"

// This forces the page to be re-rendered on every request, ensuring fresh data.
export const dynamic = "force-dynamic"

// This is now a pure Server Component. It fetches data and passes it to the client.
export default async function AdminPage() {
  const supabase = createServerSupabaseClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/")
  }

  // Fetch initial data on the server
  const { data: brands, error: brandsError } = await supabase.from("brands").select("*").order("name")

  const { data: submissions, error: submissionsError } = await supabase
    .from("submissions")
    .select("*, brands(name)")
    .order("created_at", { ascending: false })

  const { data: uploadedFiles, error: filesError } = await supabase.from("uploaded_files").select("*")

  // Handle errors gracefully
  if (brandsError) {
    return <p className="text-red-500 p-8">Error loading brands: {brandsError.message}</p>
  }
  if (submissionsError) {
    return <p className="text-red-500 p-8">Error loading submissions: {submissionsError.message}</p>
  }
  if (filesError) {
    console.error("Error fetching files:", filesError)
    // We can probably continue without files, so just log it.
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
      initialBrands={(brands as BrandType[]) || []}
      initialSubmissions={formattedSubmissions as (SubmissionType & { brand_name: string })[]}
      initialUploadedFiles={(uploadedFiles as UploadedFileType[]) || []}
      user={session.user}
    />
  )
}

function BrandForm({
  brand,
  uploadedFiles,
  onSave,
  onCancel,
}: {
  brand: any | null
  uploadedFiles: any[]
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
        <label htmlFor="name">Brand Name</label>
        <input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>
      <div>
        <label htmlFor="primaryColor">Primary Color</label>
        <input
          id="primaryColor"
          placeholder="e.g., #007bff or a Tailwind color"
          value={formData.primaryColor}
          onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
        />
      </div>
      <div>
        <label htmlFor="email">Recipient Email</label>
        <input
          id="email"
          type="email"
          placeholder="orders@example.com"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
        />
      </div>
      <div>
        <label htmlFor="logo">Logo URL</label>
        <select
          value={formData.logo}
          onChange={(e) => setFormData({ ...formData, logo: e.target.value === "none" ? "" : e.target.value })}
        >
          <option value="none">No logo</option>
          {Array.isArray(uploadedFiles) &&
            uploadedFiles.map((file) => (
              <option key={file.id} value={file.url}>
                {file.original_name}
              </option>
            ))}
        </select>
        <input
          className="mt-2"
          placeholder="Or enter custom URL"
          value={formData.logo}
          onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
        />
      </div>
      <div>
        <label htmlFor="clinics">Clinic Locations (one per line)</label>
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
        <label htmlFor="active" className="font-medium">
          Active
        </label>
      </div>
      <div className="flex justify-end gap-2 pt-4">
        <button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit">Save</button>
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
  submission: any | null
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
    <div className={open ? "block" : "hidden"} onClick={() => onOpenChange(false)}>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
        <div className="bg-white p-6 rounded shadow-lg w-full max-w-md relative" onClick={(e) => e.stopPropagation()}>
          <div>
            <h2 className="text-xl font-bold mb-4">Mark Order as Complete</h2>
          </div>
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
              <label htmlFor="delivery_details">Delivery Details (Courier, Tracking #, etc.)</label>
              <Textarea id="delivery_details" />
            </div>
            <div>
              <label htmlFor="expected_delivery_date">Expected Delivery Date</label>
              <div className="relative">
                <button
                  variant={"outline"}
                  className={cn("w-full justify-start text-left font-normal", !submission && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {submission ? format(submission.expected_delivery_date, "PPP") : <span>Pick a date</span>}
                </button>
                <div className="absolute top-full left-0 w-full mt-2">
                  <Calendar
                    mode="single"
                    selected={submission.expected_delivery_date}
                    onSelect={onSubmit}
                    initialFocus
                  />
                </div>
              </div>
              {errors.expected_delivery_date && (
                <p className="text-xs text-red-500 mt-1">{errors.expected_delivery_date.message}</p>
              )}
            </div>
            {errorMessage && <Alert variant="destructive">{errorMessage}</Alert>}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
                Cancel
              </button>
              <button type="submit" disabled={isSaving}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save and Complete
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
