"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useForm, Controller } from "react-hook-form"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Loader2, CalendarIcon, PlusCircle } from "lucide-react"
import { Alert } from "@/components/ui/alert"
import { cn } from "@/lib/utils"
import type { Brand, UploadedFile, Submission } from "@/lib/types"
import SubmissionsTable from "./SubmissionsTable"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type FormattedSubmission = Submission & { brand_name: string }

interface AdminDashboardProps {
  initialBrands: Brand[]
  initialSubmissions: FormattedSubmission[]
}

export default function AdminDashboard({ initialBrands, initialSubmissions }: AdminDashboardProps) {
  const router = useRouter()
  const [brands, setBrands] = useState<Brand[]>(initialBrands)
  const [submissions, setSubmissions] = useState<FormattedSubmission[]>(initialSubmissions)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [isBrandFormOpen, setIsBrandFormOpen] = useState(false)
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null)
  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false)
  const [selectedSubmission, setSelectedSubmission] = useState<FormattedSubmission | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const refreshData = useCallback(() => {
    router.refresh()
  }, [router])

  useEffect(() => {
    setBrands(initialBrands)
    setSubmissions(initialSubmissions)
  }, [initialBrands, initialSubmissions])

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const res = await fetch("/api/admin/files")
        if (!res.ok) throw new Error("Failed to fetch files")
        const data = await res.json()
        setUploadedFiles(data)
      } catch (error) {
        console.error(error)
        toast({
          title: "Error",
          description: "Could not load uploaded files.",
          variant: "destructive",
        })
      }
    }
    fetchFiles()
  }, [])

  const handleEditBrand = (brand: Brand) => {
    setSelectedBrand(brand)
    setIsBrandFormOpen(true)
  }

  const handleAddNewBrand = () => {
    setSelectedBrand(null)
    setIsBrandFormOpen(true)
  }

  const handleSaveBrand = async (brandData: any) => {
    setIsLoading(true)
    const method = brandData.id ? "PUT" : "POST"
    const endpoint = brandData.id ? `/api/admin/brands/${brandData.id}` : "/api/admin/brands"

    try {
      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(brandData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to save brand.")
      }

      toast({
        title: "Success",
        description: `Brand ${brandData.id ? "updated" : "created"} successfully.`,
      })
      setIsBrandFormOpen(false)
      refreshData()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unknown error occurred.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleMarkComplete = (submission: FormattedSubmission) => {
    setSelectedSubmission(submission)
    setIsCompleteDialogOpen(true)
  }

  const onCompleted = () => {
    setIsCompleteDialogOpen(false)
    toast({
      title: "Success",
      description: "Order marked as complete.",
    })
    refreshData()
  }

  const handleSubmissionUpdated = (updatedSubmission: Submission) => {
    setSubmissions((prev) => prev.map((s) => (s.id === updatedSubmission.id ? updatedSubmission : s)))
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <Button onClick={handleAddNewBrand}>Add New Brand</Button>
      </div>
      <Tabs defaultValue="submissions">
        <TabsList>
          <TabsTrigger value="submissions">Submissions</TabsTrigger>
          <TabsTrigger value="brands">Brands</TabsTrigger>
        </TabsList>
        <TabsContent value="submissions">
          <SubmissionsTable
            submissions={submissions}
            refreshSubmissions={refreshData}
            onMarkComplete={handleMarkComplete}
            onSubmissionUpdated={handleSubmissionUpdated}
          />
        </TabsContent>
        <TabsContent value="brands">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Brands</CardTitle>
              <Button asChild>
                <Link href="/admin/editor/new">
                  <PlusCircle className="mr-2 h-4 w-4" /> Add New Brand
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {brands.map((brand) => (
                  <Link href={`/admin/editor/${brand.slug}`} key={brand.id}>
                    <div className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                      <h3 className="font-semibold">{brand.name}</h3>
                      <p className="text-sm text-gray-500">{brand.slug}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isBrandFormOpen} onOpenChange={setIsBrandFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedBrand ? "Edit Brand" : "Add New Brand"}</DialogTitle>
          </DialogHeader>
          <BrandForm
            brand={selectedBrand}
            uploadedFiles={uploadedFiles}
            onSave={handleSaveBrand}
            onCancel={() => setIsBrandFormOpen(false)}
            isLoading={isLoading}
          />
        </DialogContent>
      </Dialog>

      <CompleteSubmissionDialog
        open={isCompleteDialogOpen}
        onOpenChange={setIsCompleteDialogOpen}
        submission={selectedSubmission}
        onCompleted={onCompleted}
      />
    </div>
  )
}

function BrandForm({
  brand,
  uploadedFiles,
  onSave,
  onCancel,
  isLoading,
}: {
  brand: Brand | null
  uploadedFiles: UploadedFile[]
  onSave: (brand: any) => void
  onCancel: () => void
  isLoading: boolean
}) {
  const [formData, setFormData] = useState({
    id: brand?.id || undefined,
    name: brand?.name || "",
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
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Save"}
        </Button>
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
  submission: FormattedSubmission | null
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
        delivery_details: submission?.delivery_details || "",
        expected_delivery_date: submission?.expected_delivery_date
          ? new Date(submission.expected_delivery_date)
          : new Date(),
      })
      setErrorMessage("")
    }
  }, [open, reset, submission])

  const onSubmit = async (data: any) => {
    if (!submission) return
    setIsSaving(true)
    setErrorMessage("")
    try {
      const response = await fetch(`/api/admin/submissions/${submission.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "completed",
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
