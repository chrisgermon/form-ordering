"use client"

import type React from "react"
import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  Trash2,
  Edit,
  Plus,
  Upload,
  Eye,
  Download,
  Loader2,
  Link2,
  ArrowLeft,
  Copy,
  ArrowUpDown,
  RefreshCw,
  Database,
  Send,
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  initializeDatabase,
  autoAssignPdfs,
  runSchemaV5Update,
  forceSchemaReload,
  runBrandSchemaCorrection,
  sendTestEmail,
} from "./actions"
import { BrandForm } from "./BrandForm"
import { resolveAssetUrl } from "@/lib/utils"
import type { ClinicLocation } from "@/lib/types"

interface Brand {
  id: string
  name: string
  slug: string
  logo: string
  active: boolean
  emails: string[]
  clinic_locations: ClinicLocation[] // Changed from string[]
}

interface UploadedFile {
  id: string
  filename: string
  original_name: string
  url: string
  uploaded_at: string
  size: number
  content_type: string | null
}

type SortableFileKeys = keyof UploadedFile | "size"

const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${Number.parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

export default function AdminDashboard() {
  const [brands, setBrands] = useState<Brand[]>([])
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState("")
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null)
  const [showBrandDialog, setShowBrandDialog] = useState(false)
  const [isInitializing, setIsInitializing] = useState(false)
  const [isAssigning, setIsAssigning] = useState(false)
  const router = useRouter()
  const [submissions, setSubmissions] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [sortConfig, setSortConfig] = useState<{ key: SortableFileKeys; direction: "ascending" | "descending" }>({
    key: "uploaded_at",
    direction: "descending",
  })
  const [fileTypeFilter, setFileTypeFilter] = useState("all")
  const [isUpdatingSchema, setIsUpdatingSchema] = useState(false)
  const [isReloadingSchema, setIsReloadingSchema] = useState(false)
  const [isCorrectingSchema, setIsCorrectingSchema] = useState(false)
  const [testEmail, setTestEmail] = useState("")
  const [isSendingTestEmail, setIsSendingTestEmail] = useState(false)

  const isDevelopment = process.env.NODE_ENV === "development"

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
    try {
      const brandsResponse = await fetch("/api/admin/brands")
      if (brandsResponse.ok) {
        const brandsData = await brandsResponse.json()
        // Defensively add missing properties to prevent client-side errors
        const processedBrands = (brandsData || []).map((brand: any) => ({
          ...brand,
          emails: brand.emails || [],
          clinic_locations: brand.clinic_locations || [],
        }))
        setBrands(processedBrands)
      } else {
        const errorData = await brandsResponse.json()
        if (errorData.error && (errorData.error.includes("does not exist") || errorData.error.includes("column"))) {
          setMessage(
            "Schema Error: The 'brands' table seems to be out of sync. Please go to the 'System Actions' tab and run the 'Correct Brands Schema' script.",
          )
        } else {
          setMessage("Failed to load brands.")
        }
        setBrands([])
      }
    } catch (e) {
      setMessage("Failed to load brands due to a network or server error.")
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

  const handleInitializeDatabase = async () => {
    if (
      !confirm(
        "Are you sure you want to initialize the database? This will delete ALL existing brands, forms, and submissions and create 5 new blank brands.",
      )
    )
      return
    setIsInitializing(true)
    setMessage("Initializing database, please wait...")
    try {
      const result = await initializeDatabase()
      setMessage(result.message)
      if (result.success) {
        await loadAllData()
      }
    } catch (error) {
      setMessage("An unexpected error occurred during initialization.")
    } finally {
      setIsInitializing(false)
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setMessage(`Copied URL to clipboard.`)
    setTimeout(() => setMessage(""), 3000)
  }

  const filteredAndSortedFiles = useMemo(() => {
    if (!Array.isArray(uploadedFiles)) return []
    let filtered = [...uploadedFiles]

    if (searchTerm) {
      filtered = filtered.filter((file) => file.original_name.toLowerCase().includes(searchTerm.toLowerCase()))
    }

    if (fileTypeFilter !== "all") {
      filtered = filtered.filter((file) => file.content_type === fileTypeFilter)
    }

    filtered.sort((a, b) => {
      const aValue = a[sortConfig.key as keyof UploadedFile]
      const bValue = b[sortConfig.key as keyof UploadedFile]

      if (aValue === null) return 1
      if (bValue === null) return -1
      if (aValue < bValue) return sortConfig.direction === "ascending" ? -1 : 1
      if (aValue > bValue) return sortConfig.direction === "ascending" ? 1 : -1
      return 0
    })

    return filtered
  }, [uploadedFiles, searchTerm, sortConfig, fileTypeFilter])

  const requestSort = (key: SortableFileKeys) => {
    let direction: "ascending" | "descending" = "ascending"
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending"
    }
    setSortConfig({ key, direction })
  }

  const fileTypes = useMemo(() => {
    if (!Array.isArray(uploadedFiles)) return ["all"]
    const types = new Set(uploadedFiles.map((file) => file.content_type).filter(Boolean))
    return ["all", ...Array.from(types as Set<string>)]
  }, [uploadedFiles])

  const handleSchemaV5Update = async () => {
    if (!confirm("This will update your database to support relative file URLs. This is a required step. Continue?"))
      return
    setIsUpdatingSchema(true)
    setMessage("Updating database schema...")
    try {
      const result = await runSchemaV5Update()
      setMessage(result.message)
    } catch (error) {
      setMessage("An unexpected error occurred during the schema update.")
    } finally {
      setIsUpdatingSchema(false)
    }
  }

  const handleForceSchemaReload = async () => {
    if (
      !confirm(
        "This will force the API to reload its database schema. This can resolve issues where new columns are not found. Continue?",
      )
    )
      return
    setIsReloadingSchema(true)
    setMessage("Reloading schema cache...")
    try {
      const result = await forceSchemaReload()
      setMessage(result.message)
    } catch (error) {
      setMessage("An unexpected error occurred while reloading the schema.")
    } finally {
      setIsReloadingSchema(false)
    }
  }

  const handleBrandSchemaCorrection = async () => {
    if (
      !confirm(
        "This will attempt to fix common issues with the 'brands' table schema, like incorrect column names. Continue?",
      )
    )
      return
    setIsCorrectingSchema(true)
    setMessage("Correcting brands table schema...")
    try {
      const result = await runBrandSchemaCorrection()
      setMessage(result.message)
      if (result.success) {
        await loadAllData()
      }
    } catch (error) {
      setMessage("An unexpected error occurred during schema correction.")
    } finally {
      setIsCorrectingSchema(false)
    }
  }

  const handleSendTestEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!testEmail) {
      setMessage("Please enter a recipient email address.")
      return
    }
    setIsSendingTestEmail(true)
    setMessage(`Sending test email to ${testEmail}...`)
    try {
      const result = await sendTestEmail(testEmail)
      setMessage(result.message)
    } catch (error) {
      setMessage("An unexpected error occurred while sending the test email.")
    } finally {
      setIsSendingTestEmail(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <div className="flex items-center gap-4">
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
          <TabsList className={`grid w-full ${isDevelopment ? "grid-cols-5" : "grid-cols-4"}`}>
            <TabsTrigger value="brands">Brands</TabsTrigger>
            <TabsTrigger value="submissions">Submissions</TabsTrigger>
            <TabsTrigger value="files">Files</TabsTrigger>
            <TabsTrigger value="actions">System Actions</TabsTrigger>
            {isDevelopment && <TabsTrigger value="tests">System Tests</TabsTrigger>}
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
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>{editingBrand ? "Edit Brand" : "Add Brand"}</DialogTitle>
                      <DialogDescription>
                        {editingBrand
                          ? "Edit the details of this brand."
                          : "Create a new brand for the ordering system."}
                      </DialogDescription>
                    </DialogHeader>
                    <BrandForm
                      brand={editingBrand}
                      uploadedFiles={uploadedFiles}
                      onSave={saveBrand}
                      onCancel={() => {
                        setShowBrandDialog(false)
                        setEditingBrand(null)
                      }}
                      onLogoUpload={async () => await loadUploadedFiles()}
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
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(brands || []).map((brand) => (
                        <TableRow key={brand.id}>
                          <TableCell>
                            <img
                              src={resolveAssetUrl(brand.logo) || "/placeholder.svg"}
                              alt={`${brand.name} Logo`}
                              className="h-10 w-auto object-contain bg-gray-100 p-1 rounded"
                            />
                          </TableCell>
                          <TableCell className="font-medium">{brand.name}</TableCell>
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
                                <Link href={`/admin/editor/${brand.slug}`} prefetch={false}>
                                  <Edit className="mr-2 h-4 w-4" /> Edit Form
                                </Link>
                              </Button>
                              <Button size="sm" variant="outline" asChild>
                                <Link href={`/forms/${brand.slug}`} target="_blank" prefetch={false}>
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
                <CardTitle>Order Submissions</CardTitle>
                <p className="text-sm text-muted-foreground">Here are the latest order forms submitted by users.</p>
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
                        <TableHead>Brand</TableHead>
                        <TableHead>Ordered By</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>IP Address</TableHead>
                        <TableHead className="text-right">PDF</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(submissions || []).map((submission) => (
                        <TableRow key={submission.id}>
                          <TableCell className="font-medium">{submission.brands?.name || "N/A"}</TableCell>
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
                                    : "secondary"
                              }
                              className="capitalize"
                            >
                              {submission.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-xs">{submission.ip_address}</TableCell>
                          <TableCell className="text-right">
                            <Button size="sm" variant="outline" asChild>
                              <a href={submission.pdf_url} target="_blank" rel="noopener noreferrer">
                                <Download className="mr-2 h-4 w-4" /> View PDF
                              </a>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
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
                <div className="flex items-center gap-4 mb-4">
                  <Input
                    placeholder="Search by filename..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                  />
                  <Select value={fileTypeFilter} onValueChange={setFileTypeFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent>
                      {fileTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type === "all" ? "All Types" : type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>
                          <Button variant="ghost" onClick={() => requestSort("original_name")}>
                            Filename
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                          </Button>
                        </TableHead>
                        <TableHead>
                          <Button variant="ghost" onClick={() => requestSort("content_type")}>
                            Type
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                          </Button>
                        </TableHead>
                        <TableHead>
                          <Button variant="ghost" onClick={() => requestSort("size")}>
                            Size
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                          </Button>
                        </TableHead>
                        <TableHead>
                          <Button variant="ghost" onClick={() => requestSort("uploaded_at")}>
                            Uploaded
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                          </Button>
                        </TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAndSortedFiles.length > 0 ? (
                        filteredAndSortedFiles.map((file) => (
                          <TableRow key={file.id}>
                            <TableCell className="font-medium">{file.original_name}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{file.content_type || "Unknown"}</Badge>
                            </TableCell>
                            <TableCell>{formatBytes(file.size)}</TableCell>
                            <TableCell>{new Date(file.uploaded_at).toLocaleDateString()}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex gap-1 justify-end">
                                <Button size="icon" variant="ghost" asChild>
                                  <a href={file.url} target="_blank" rel="noopener noreferrer" title="View File">
                                    <Eye className="h-4 w-4" />
                                  </a>
                                </Button>
                                <Button size="icon" variant="ghost" asChild>
                                  <a href={file.url} download={file.original_name} title="Download File">
                                    <Download className="h-4 w-4" />
                                  </a>
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => copyToClipboard(file.url)}
                                  title="Copy URL"
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="text-destructive hover:text-destructive"
                                  onClick={() => deleteFile(file.id)}
                                  title="Delete File"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="h-24 text-center">
                            No files found.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="actions">
            <Card>
              <CardHeader>
                <CardTitle>System Actions</CardTitle>
                <p className="text-sm text-muted-foreground">Use these actions for database maintenance and setup.</p>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card className="p-4 flex flex-col justify-between border-blue-500 border-2">
                  <div>
                    <h3 className="font-semibold text-blue-700">Correct Brands Schema</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Run this first if you see errors about missing 'emails' or 'clinic_locations' columns. This fixes
                      the table and reloads the schema cache.
                    </p>
                  </div>
                  <Button
                    onClick={handleBrandSchemaCorrection}
                    disabled={isCorrectingSchema}
                    className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {isCorrectingSchema ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Database className="mr-2 h-4 w-4" />
                    )}
                    Fix Brands Table
                  </Button>
                </Card>
                <Card className="p-4 flex flex-col justify-between">
                  <div>
                    <h3 className="font-semibold">Force Schema Reload</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      If you see errors like "column not found" after a migration, run this to refresh the API's schema
                      cache.
                    </p>
                  </div>
                  <Button
                    onClick={handleForceSchemaReload}
                    disabled={isReloadingSchema}
                    variant="outline"
                    className="mt-4 bg-transparent"
                  >
                    {isReloadingSchema ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="mr-2 h-4 w-4" />
                    )}
                    Reload Schema
                  </Button>
                </Card>
                <Card className="p-4 flex flex-col justify-between">
                  <div>
                    <h3 className="font-semibold">Update Schema for Relative URLs</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Adds the 'pathname' column required for serving files from your domain. Run this once.
                    </p>
                  </div>
                  <Button
                    onClick={handleSchemaV5Update}
                    disabled={isUpdatingSchema}
                    variant="outline"
                    className="mt-4 bg-transparent"
                  >
                    {isUpdatingSchema ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Database className="mr-2 h-4 w-4" />
                    )}
                    Run Schema Update (v5)
                  </Button>
                </Card>
                <Card className="p-4 flex flex-col justify-between">
                  <div>
                    <h3 className="font-semibold">Initialize Database</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Wipes all data and creates 5 blank brands. Use this for a fresh start.
                    </p>
                  </div>
                  <Button
                    onClick={handleInitializeDatabase}
                    disabled={isInitializing}
                    variant="destructive"
                    className="mt-4"
                  >
                    {isInitializing ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="mr-2 h-4 w-4" />
                    )}
                    Initialize & Reset
                  </Button>
                </Card>
              </CardContent>
            </Card>
          </TabsContent>

          {isDevelopment && (
            <TabsContent value="tests">
              <Card>
                <CardHeader>
                  <CardTitle>System Tests</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Use these tools to verify that key system components are working correctly.
                  </p>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="p-4 flex flex-col justify-between">
                    <div>
                      <h3 className="font-semibold">Send Test Email</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Verify that your email configuration (Mailgun SMTP) is working correctly by sending a test email
                        to an address of your choice.
                      </p>
                    </div>
                    <form onSubmit={handleSendTestEmail} className="mt-4 flex items-center gap-2">
                      <Input
                        type="email"
                        placeholder="recipient@example.com"
                        value={testEmail}
                        onChange={(e) => setTestEmail(e.target.value)}
                        required
                        className="max-w-xs"
                        disabled={isSendingTestEmail}
                      />
                      <Button type="submit" disabled={isSendingTestEmail || !testEmail}>
                        {isSendingTestEmail ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="mr-2 h-4 w-4" />
                        )}
                        Send Email
                      </Button>
                    </form>
                  </Card>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  )
}
