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
import { Loader2, CalendarIcon, PlusCircle, Upload, Edit, Trash2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import type { Brand, UploadedFile, Submission } from "@/lib/types"
import { Textarea } from "@/components/ui/textarea"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import SubmissionsTable from "./SubmissionsTable"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import Link from "next/link"

// This is now a Client Component that handles all the state and interactions.
export default function AdminDashboard({
  initialBrands,
  initialSubmissions,
  initialUploadedFiles,
}: {
  initialBrands: Brand[]
  initialSubmissions: (Submission & { brand_name: string })[]
  initialUploadedFiles: UploadedFile[]
}) {
  const [brands, setBrands] = useState<Brand[]>(initialBrands)
  const [submissions, setSubmissions] = useState<(Submission & { brand_name: string })[]>(initialSubmissions)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>(initialUploadedFiles)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isBrandFormOpen, setIsBrandFormOpen] = useState(false)
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null)
  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false)
  const [completingSubmission, setCompletingSubmission] = useState<Submission | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deletingBrand, setDeletingBrand] = useState<Brand | null>(null)

  const fetchAllData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [brandsRes, submissionsRes, filesRes] = await Promise.all([
        fetch("/api/admin/brands"),
        fetch("/api/admin/submissions"),
        fetch("/api/admin/files"),
      ])

      if (!brandsRes.ok || !submissionsRes.ok || !filesRes.ok) {
        throw new Error("Failed to fetch data.")
      }

      const [brandsData, submissionsData, filesData] = await Promise.all([
        brandsRes.json(),
        submissionsRes.json(),
        filesRes.json(),
      ])

      setBrands(brandsData)
      setSubmissions(submissionsData)
      setUploadedFiles(filesData)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred.")
    } finally {
      setLoading(false)
    }
  }

  const handleSaveBrand = async (brandData: any) => {
    const method = brandData.id ? "PUT" : "POST"
    const url = brandData.id ? `/api/admin/brands/${brandData.slug}` : "/api/admin/brands"

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(brandData),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to save brand.")
      }
      setIsBrandFormOpen(false)
      setEditingBrand(null)
      await fetchAllData() // Refresh data
    } catch (err) {
      alert(err instanceof Error ? err.message : "An unknown error occurred.")
    }
  }

  const handleDeleteBrand = async () => {
    if (!deletingBrand) return
    try {
      const response = await fetch(`/api/admin/brands/${deletingBrand.slug}`, {
        method: "DELETE",
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete brand.")
      }
      setIsDeleteDialogOpen(false)
      setDeletingBrand(null)
      await fetchAllData() // Refresh data
    } catch (err) {
      alert(err instanceof Error ? err.message : "An unknown error occurred.")
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append("file", file)

    try {
      const response = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "File upload failed.")
      }
      await fetchAllData() // Refresh files list
    } catch (err) {
      alert(err instanceof Error ? err.message : "An unknown error occurred.")
    }
  }

  const handleCompleteSubmission = () => {
    setIsCompleteDialogOpen(false)
    setCompletingSubmission(null)
    fetchAllData() // Refresh submissions
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <div className="flex gap-2">
          <Button onClick={() => setIsBrandFormOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" /> New Brand
          </Button>
          <Button variant="outline" asChild>
            <label htmlFor="file-upload" className="cursor-pointer">
              <Upload className="mr-2 h-4 w-4" /> Upload Logo
            </label>
          </Button>
          <input id="file-upload" type="file" className="hidden" onChange={handleFileUpload} accept="image/*" />
        </div>
      </header>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Brands</h2>
        {loading && !brands.length ? (
          <p>Loading brands...</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {brands.map((brand) => (
              <div key={brand.id} className="border rounded-lg p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    {brand.logo && (
                      <img src={brand.logo || "/placeholder.svg"} alt={`${brand.name} logo`} className="h-8 w-auto" />
                    )}
                    <h3 className="font-bold text-lg">{brand.name}</h3>
                  </div>
                  <p className={`text-sm ${brand.active ? "text-green-600" : "text-red-500"}`}>
                    {brand.active ? "Active" : "Inactive"}
                  </p>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingBrand(brand)
                      setIsBrandFormOpen(true)
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/admin/editor/${brand.slug}`}>
                      <span className="sr-only">Edit Form</span>
                      <Edit className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      setDeletingBrand(brand)
                      setIsDeleteDialogOpen(true)
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4">Recent Submissions</h2>
        <SubmissionsTable
          submissions={submissions}
          onMarkComplete={(submission) => {
            setCompletingSubmission(submission)
            setIsCompleteDialogOpen(true)
          }}
        />
      </section>

      <Dialog open={isBrandFormOpen} onOpenChange={setIsBrandFormOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingBrand ? "Edit Brand" : "Create New Brand"}</DialogTitle>
          </DialogHeader>
          <BrandForm
            brand={editingBrand}
            uploadedFiles={uploadedFiles}
            onSave={handleSaveBrand}
            onCancel={() => {
              setIsBrandFormOpen(false)
              setEditingBrand(null)
            }}
          />
        </DialogContent>
      </Dialog>

      <CompleteSubmissionDialog
        open={isCompleteDialogOpen}
        onOpenChange={setIsCompleteDialogOpen}
        submission={completingSubmission}
        onCompleted={handleCompleteSubmission}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the brand &quot;{deletingBrand?.name}&quot; and all associated form
              configurations. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteBrand}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// These sub-components should be here or in their own files.
// For now, keeping them here is fine as they are tightly coupled with the dashboard.

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
    slug: brand?.slug || "",
    logo: brand?.logo || "",
    primary_color: brand?.primary_color || "",
    email: brand?.email || "",
    active: brand?.active ?? true,
  })
  const [clinicsText, setClinicsText] = useState(brand?.clinics?.join("\n") || "")

  useEffect(() => {
    if (brand) {
      setFormData({
        id: brand.id,
        name: brand.name,
        slug: brand.slug,
        logo: brand.logo || "",
        primary_color: brand.primary_color || "",
        email: brand.email,
        active: brand.active,
      })
      setClinicsText(brand.clinics?.join("\n") || "")
    } else {
      setFormData({
        id: undefined,
        name: "",
        slug: "",
        logo: "",
        primary_color: "",
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
          value={formData.primary_color}
          onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
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
              <strong>Brand:</strong> {(submission as any).brand_name}
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
