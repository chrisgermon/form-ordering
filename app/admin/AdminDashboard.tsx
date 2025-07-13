"use client"

import { useState, useCallback } from "react"
import Link from "next/link"
import { BrandGrid } from "./BrandGrid"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { BrandForm } from "./BrandForm"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SubmissionsTable } from "./SubmissionsTable"
import { FileManager } from "./FileManager"
import type { Brand, FormSubmission, FileRecord } from "@/lib/types"
import { revalidateAllData } from "./actions"
import { toast } from "sonner"
import { RefreshCw, Home, AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface AdminDashboardProps {
  initialBrands: Brand[]
  initialSubmissions: FormSubmission[]
  initialFiles: FileRecord[]
  error: string | null
}

export function AdminDashboard({ initialBrands, initialSubmissions, initialFiles, error }: AdminDashboardProps) {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null)
  const [brands, setBrands] = useState<Brand[]>(initialBrands || [])
  const [files, setFiles] = useState<FileRecord[]>(initialFiles || [])
  const [submissions, setSubmissions] = useState<FormSubmission[]>(initialSubmissions || [])

  const fetchBrands = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/brands")
      if (response.ok) {
        const data = await response.json()
        setBrands(data)
      } else {
        toast.error("Failed to fetch brands.")
      }
    } catch (e) {
      toast.error("An error occurred while fetching brands.")
    }
  }, [])

  const fetchFiles = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/files")
      if (response.ok) {
        const data = await response.json()
        setFiles(data)
      } else {
        toast.error("Failed to fetch files.")
      }
    } catch (e) {
      toast.error("An error occurred while fetching files.")
    }
  }, [])

  const fetchSubmissions = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/submissions")
      if (response.ok) {
        const data = await response.json()
        setSubmissions(data)
      } else {
        toast.error("Failed to fetch submissions.")
      }
    } catch (e) {
      toast.error("An error occurred while fetching submissions.")
    }
  }, [])

  const handleRefresh = async () => {
    toast.info("Revalidating and refreshing data...")
    const result = await revalidateAllData()
    if (result.success) {
      await Promise.all([fetchBrands(), fetchFiles(), fetchSubmissions()])
      toast.success("Data refreshed successfully!")
    } else {
      toast.error(`Failed to refresh data: ${result.error}`)
    }
  }

  const handleAddBrand = () => {
    setSelectedBrand(null)
    setIsFormOpen(true)
  }

  const handleEditBrand = (brand: Brand) => {
    setSelectedBrand(brand)
    setIsFormOpen(true)
  }

  const handleDeleteBrand = async (brandId: string) => {
    if (confirm("Are you sure you want to delete this brand and all its data? This action cannot be undone.")) {
      const response = await fetch(`/api/admin/brands?id=${brandId}`, { method: "DELETE" })
      if (response.ok) {
        toast.success("Brand deleted successfully.")
        await fetchBrands()
      } else {
        toast.error("Failed to delete brand.")
      }
    }
  }

  const handleSaveBrand = async (data: any) => {
    const isNew = !data.id
    const url = isNew ? "/api/admin/brands" : `/api/admin/brands`
    const method = isNew ? "POST" : "PUT"

    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })

    if (response.ok) {
      toast.success(`Brand ${isNew ? "created" : "updated"} successfully.`)
      setIsFormOpen(false)
      await fetchBrands()
    } else {
      const errorData = await response.json()
      toast.error(`Failed to save brand: ${errorData.error}`)
    }
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 md:p-8">
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Dashboard Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <header className="flex flex-wrap gap-4 justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <div className="flex items-center gap-2">
          <Link href="/" passHref>
            <Button variant="outline">
              <Home className="mr-2 h-4 w-4" />
              Home
            </Button>
          </Link>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh All Data
          </Button>
          <Button onClick={handleAddBrand}>Add New Brand</Button>
        </div>
      </header>

      <Tabs defaultValue="brands" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="brands">Brands</TabsTrigger>
          <TabsTrigger value="submissions">Submissions</TabsTrigger>
          <TabsTrigger value="files">File Manager</TabsTrigger>
        </TabsList>
        <TabsContent value="brands" className="mt-4">
          <BrandGrid brands={brands} onEdit={handleEditBrand} onDelete={handleDeleteBrand} />
        </TabsContent>
        <TabsContent value="submissions" className="mt-4">
          <SubmissionsTable submissions={submissions} onRefresh={fetchSubmissions} />
        </TabsContent>
        <TabsContent value="files" className="mt-4">
          <FileManager initialFiles={files} brands={brands} onFilesUpdate={fetchFiles} />
        </TabsContent>
      </Tabs>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{selectedBrand ? "Edit Brand" : "Add New Brand"}</DialogTitle>
            <DialogDescription>Manage brand settings and files below.</DialogDescription>
          </DialogHeader>
          <BrandForm
            brand={selectedBrand}
            uploadedFiles={files}
            onSave={handleSaveBrand}
            onCancel={() => setIsFormOpen(false)}
            onLogoUpload={fetchFiles}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
