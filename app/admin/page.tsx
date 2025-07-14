"use client"

import type React from "react"
import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useForm, Controller } from "react-hook-form"
import { format } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  Trash2,
  Edit,
  Plus,
  Upload,
  Eye,
  Download,
  Database,
  Loader2,
  Link2,
  ArrowLeft,
  RefreshCw,
  CheckCircle,
  CalendarIcon,
  Search,
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { runSeed, autoAssignPdfs } from "./actions"
import type { Brand, UploadedFile, Submission } from "@/lib/types"
import { Textarea } from "@/components/ui/textarea"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"

export default function AdminDashboard() {
  const [brands, setBrands] = useState<Brand[]>([])
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState("")
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null)
  const [showBrandDialog, setShowBrandDialog] = useState(false)
  const [isSeeding, setIsSeeding] = useState(false)
  const [isAssigning, setIsAssigning] = useState(false)
  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false)
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)
  const router = useRouter()

  // States for submission filtering
  const [submissionSearch, setSubmissionSearch] = useState("")
  const [selectedBrandFilter, setSelectedBrandFilter] = useState("all")
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("all")

  useEffect(() => {
    loadAllData()
  }, [])

  const loadAllData = async () => {
    setLoading(true)
    try {
      await Promise.all([loadBrands(), loadUploadedFiles(), loadSubmissions()])
    } catch (error) {
      setMessage("Error loading initial data.")
    } finally {
      setLoading(false)
    }
  }

  const loadBrands = async () => {
    const brandsResponse = await fetch("/api/admin/brands")
    if (brandsResponse.ok) {
      const brandsData = await brandsResponse.json()
      setBrands(brandsData || [])
    } else {
      setMessage("Failed to load brands.")
      setBrands([])
    }
  }

  const loadUploadedFiles = async () => {
    const filesResponse = await fetch("/api/admin/files")
    if (filesResponse.ok) {
      const filesData = await filesResponse.json()
      setUploadedFiles(filesData || [])
    } else {
      setMessage("Failed to load uploaded files.")
      setUploadedFiles([])
    }
  }

  const loadSubmissions = async () => {
    const response = await fetch("/api/admin/submissions")
    if (response.ok) {
      const data = await response.json()
      setSubmissions(data || [])
    } else {
      setMessage("Failed to load submissions.")
      setSubmissions([])
    }
  }

  const handleRefreshSubmissions = async () => {
    setMessage("Refreshing submissions...")
    await loadSubmissions()
    setMessage("Submissions refreshed.")
    setTimeout(() => setMessage(""), 3000)
  }

  const handleSeedDatabase = async () => {
    if (!confirm("Are you sure you want to re-seed the database? This will delete all existing data.")) return
    setIsSeeding(true)
    setMessage("Seeding database, please wait...")
    try {
      const result = await runSeed()
      setMessage(result.message)
      if (result.success) {
        await loadAllData()
      }
    } catch (error) {
      setMessage("An unexpected error occurred while seeding.")
    } finally {
      setIsSeeding(false)
    }
  }

  const saveBrand = async (brandData: any) => {
    try {
      const response = await fetch("/api/admin/brands", {
        method: editingBrand ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(brandData),
      })

      if (response.ok) {
        setMessage("Brand saved successfully")
        setShowBrandDialog(false)
        setEditingBrand(null)
        await loadBrands()
      } else {
        const result = await response.json()
        setMessage(`Error saving brand: ${result.error}`)
      }
    } catch (error) {
      setMessage("Error saving brand")
    }
  }

  const deleteBrand = async (brandId: string) => {
    if (
      !confirm("Are you sure you want to delete this brand? This will also delete all associated sections and items.")
    )
      return

    try {
      const response = await fetch(`/api/admin/brands?id=${brandId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setMessage("Brand deleted successfully")
        await loadBrands()
      } else {
        const result = await response.json()
        setMessage(`Error deleting brand: ${result.error}`)
      }
    } catch (error) {
      setMessage("Error deleting brand")
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setMessage(`Uploading ${files.length} file(s)...`)

    const uploadPromises = Array.from(files).map((file) => {
      const formData = new FormData()
      formData.append("file", file)
      return fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      })
    })

    try {
      const responses = await Promise.all(uploadPromises)
      const successfulUploads = responses.filter((res) => res.ok).length
      let resultMessage = `${successfulUploads} of ${files.length} files uploaded successfully.`
      const failedUploads = responses.length - successfulUploads
      if (failedUploads > 0) {
        resultMessage += ` ${failedUploads} files failed to upload.`
      }
      setMessage(resultMessage)
      if (successfulUploads > 0) {
        await loadUploadedFiles()
      }
    } catch (error) {
      setMessage("An error occurred during the bulk upload process.")
      console.error("Bulk upload error:", error)
    }
  }

  const handleAutoAssign = async () => {
    if (!confirm("This will assign PDFs to items based on filename matching the item code. Continue?")) return
    setIsAssigning(true)
    setMessage("Scanning files and assigning links...")
    try {
      const result = await autoAssignPdfs()
      setMessage(result.message)
    } catch (error) {
      setMessage("An unexpected error occurred during auto-assignment.")
    } finally {
      setIsAssigning(false)
    }
  }

  const deleteFile = async (fileId: string) => {
    if (!confirm("Are you sure you want to delete this file?")) return

    try {
      const response = await fetch(`/api/admin/files?id=${fileId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setMessage("File deleted successfully")
        await loadUploadedFiles()
      } else {
        setMessage("Error deleting file")
      }
    } catch (error) {
      setMessage("Error deleting file")
    }
  }

  const filteredSubmissions = useMemo(() => {
    return submissions.filter((submission) => {
      const searchLower = submissionSearch.toLowerCase()
      const matchesSearch =
        submissionSearch === "" ||
        submission.ordered_by.toLowerCase().includes(searchLower) ||
        submission.email.toLowerCase().includes(searchLower) ||
        submission.order_number?.toLowerCase().includes(searchLower)

      const matchesBrand = selectedBrandFilter === "all" || submission.brand_id === selectedBrandFilter

      const matchesStatus = selectedStatusFilter === "all" || submission.status === selectedStatusFilter

      return matchesSearch && matchesBrand && matchesStatus
    })
  }, [submissions, submissionSearch, selectedBrandFilter, selectedStatusFilter])

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <div className="flex items-center gap-4">
            <Button onClick={handleSeedDatabase} variant="secondary" disabled={isSeeding || loading}>
              {isSeeding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Database className="mr-2 h-4 w-4" />}
              Seed Database
            </Button>
            <Button variant="outline" onClick={() => router.push("/")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </div>
        </div>

        {message && (
          <Alert className="mb-6">
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="brands" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="brands">Brands</TabsTrigger>
            <TabsTrigger value="submissions">Submissions</TabsTrigger>
            <TabsTrigger value="files">Files</TabsTrigger>
          </TabsList>

          <TabsContent value="brands">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Brand Management</CardTitle>
                <Dialog open={showBrandDialog} onOpenChange={setShowBrandDialog}>
                  <DialogTrigger asChild>
                    <Button
                      onClick={() => {
                        setEditingBrand(null)
                        setShowBrandDialog(true)
                      }}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Brand
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editingBrand ? "Edit Brand" : "Add Brand"}</DialogTitle>
                    </DialogHeader>
                    <BrandForm
                      brand={editingBrand}
                      uploadedFiles={uploadedFiles}
                      onSave={saveBrand}
                      onCancel={() => {
                        setShowBrandDialog(false)
                        setEditingBrand(null)
                      }}
                    />
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center items-center p-10">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Logo</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Initials</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Array.isArray(brands) &&
                        brands.map((brand) => (
                          <TableRow key={brand.id}>
                            <TableCell>
                              <img
                                src={brand.logo || "/placeholder.svg?height=40&width=100&query=No+Logo"}
                                alt={`${brand.name} Logo`}
                                className="h-10 w-auto object-contain bg-gray-100 p-1 rounded"
                              />
                            </TableCell>
                            <TableCell className="font-medium">{brand.name}</TableCell>
                            <TableCell className="font-mono text-sm">{brand.initials || "N/A"}</TableCell>
                            <TableCell>
                              <Badge variant={brand.active ? "default" : "secondary"}>
                                {brand.active ? "Active" : "Inactive"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex gap-2 justify-end">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setEditingBrand(brand)
                                    setShowBrandDialog(true)
                                  }}
                                >
                                  <Edit className="mr-2 h-4 w-4" /> Edit Brand
                                </Button>
                                <Button size="sm" asChild>
                                  <Link href={`/admin/editor/${brand.slug}`}>
                                    <Edit className="mr-2 h-4 w-4" /> Edit Form
                                  </Link>
                                </Button>
                                <Button size="sm" variant="outline" asChild>
                                  <Link href={`/forms/${brand.slug}`} target="_blank">
                                    <Eye className="mr-2 h-4 w-4" /> View Form
                                  </Link>
                                </Button>
                                <Button size="sm" variant="destructive" onClick={() => deleteBrand(brand.id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="submissions">
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-grow">
                    <CardTitle>Order Submissions</CardTitle>
                    <p className="text-sm text-muted-foreground">Search, filter, and manage submitted order forms.</p>
                  </div>
                  <Button onClick={handleRefreshSubmissions} variant="outline" size="sm">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh
                  </Button>
                </div>
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="relative md:col-span-1">
                    <label htmlFor="submission-search" className="sr-only">
                      Search Submissions
                    </label>
                    <Input
                      id="submission-search"
                      placeholder="Search by name, email, or order #"
                      className="pl-10"
                      value={submissionSearch}
                      onChange={(e) => setSubmissionSearch(e.target.value)}
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  </div>
                  <div className="md:col-span-1">
                    <Select value={selectedBrandFilter} onValueChange={setSelectedBrandFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Filter by brand" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Brands</SelectItem>
                        {brands.map((brand) => (
                          <SelectItem key={brand.id} value={brand.id}>
                            {brand.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-1">
                    <Select value={selectedStatusFilter} onValueChange={setSelectedStatusFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="sent">Sent</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center items-center p-10">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order #</TableHead>
                        <TableHead>Brand</TableHead>
                        <TableHead>Ordered By</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>PDF</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSubmissions.length > 0 ? (
                        filteredSubmissions.map((submission) => (
                          <TableRow key={submission.id}>
                            <TableCell className="font-mono text-sm">{submission.order_number}</TableCell>
                            <TableCell className="font-medium">{submission.brand_name}</TableCell>
                            <TableCell>
                              <div>{submission.ordered_by}</div>
                              <div className="text-xs text-muted-foreground">{submission.email}</div>
                            </TableCell>
                            <TableCell>
                              {new Date(submission.created_at).toLocaleDateString("en-AU", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })}
                            </TableCell>
                            <TableCell>
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
                            </TableCell>
                            <TableCell>
                              <Button size="sm" variant="outline" asChild>
                                <a href={submission.pdf_url} target="_blank" rel="noopener noreferrer">
                                  <Download className="mr-2 h-4 w-4" /> View PDF
                                </a>
                              </Button>
                            </TableCell>
                            <TableCell className="text-right">
                              {submission.status === "completed" ? (
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button variant="outline" size="sm">
                                      View Details
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-80">
                                    <h4 className="font-semibold mb-2">Completion Details</h4>
                                    <p className="text-sm">
                                      <strong>Date:</strong>{" "}
                                      {submission.completed_at
                                        ? new Date(submission.completed_at).toLocaleDateString("en-AU")
                                        : "N/A"}
                                    </p>
                                    <p className="text-sm">
                                      <strong>Expected Delivery:</strong>{" "}
                                      {submission.expected_delivery_date
                                        ? new Date(submission.expected_delivery_date).toLocaleDateString("en-AU")
                                        : "N/A"}
                                    </p>
                                    <p className="text-sm mt-2">
                                      <strong>Details:</strong>
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      {submission.delivery_details || "No details provided."}
                                    </p>
                                  </PopoverContent>
                                </Popover>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedSubmission(submission)
                                    setIsCompleteDialogOpen(true)
                                  }}
                                >
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Mark as Complete
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={7} className="h-24 text-center">
                            No submissions found.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="files">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>File Management</CardTitle>
                <div className="flex items-center gap-2">
                  <Button onClick={handleAutoAssign} variant="secondary" disabled={isAssigning || loading}>
                    {isAssigning ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Link2 className="mr-2 h-4 w-4" />
                    )}
                    Auto-assign PDF Links
                  </Button>
                  <div className="relative">
                    <Button asChild>
                      <label htmlFor="file-upload" className="cursor-pointer">
                        <Upload className="mr-2 h-4 w-4" />
                        Upload File(s)
                      </label>
                    </Button>
                    <Input
                      id="file-upload"
                      type="file"
                      multiple
                      accept=".pdf,.png,.jpg,.jpeg,.svg"
                      onChange={handleFileUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array.isArray(uploadedFiles) &&
                    uploadedFiles.map((file) => (
                      <Card key={file.id} className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold truncate">{file.original_name}</h3>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" asChild>
                              <a href={file.url} target="_blank" rel="noopener noreferrer">
                                <Eye className="mr-2 h-4 w-4" />
                              </a>
                            </Button>
                            <Button size="sm" variant="outline" asChild>
                              <a href={file.url} download={file.original_name}>
                                <Download className="h-4 w-4" />
                              </a>
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => deleteFile(file.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                        <p className="text-xs text-gray-500">{new Date(file.uploaded_at).toLocaleDateString()}</p>
                        <div className="mt-2">
                          <Input
                            value={file.url}
                            readOnly
                            className="text-xs"
                            onClick={(e) => e.currentTarget.select()}
                          />
                        </div>
                      </Card>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      <CompleteSubmissionDialog
        open={isCompleteDialogOpen}
        onOpenChange={setIsCompleteDialogOpen}
        submission={selectedSubmission}
        onCompleted={() => {
          setIsCompleteDialogOpen(false)
          setSelectedSubmission(null)
          loadSubmissions()
          setMessage("Submission marked as complete.")
        }}
      />
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
        initials: brand.initials || "",
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
        initials: "",
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
