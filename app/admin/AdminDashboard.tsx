"use client"

import { useState, useCallback } from "react"
import { BrandGrid } from "./BrandGrid"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { BrandForm } from "./BrandForm"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SubmissionsTable } from "./SubmissionsTable"
import type { Brand, UploadedFile, FormSubmission } from "@/lib/types"

interface AdminDashboardProps {
  initialBrands: Brand[]
  initialFiles: UploadedFile[]
  initialSubmissions: FormSubmission[]
  error: string | null
}

export function AdminDashboard({ initialBrands, initialFiles, initialSubmissions, error }: AdminDashboardProps) {
  const [brands, setBrands] = useState<Brand[]>(initialBrands)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>(initialFiles)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null)

  const fetchBrands = useCallback(async () => {
    const response = await fetch("/api/admin/brands")
    if (response.ok) {
      const data = await response.json()
      setBrands(data)
    }
  }, [])

  const fetchFiles = useCallback(async () => {
    const response = await fetch("/api/admin/files")
    if (response.ok) {
      const data = await response.json()
      setUploadedFiles(data)
    }
  }, [])

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
        await fetchBrands()
      } else {
        alert("Failed to delete brand.")
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
      setIsFormOpen(false)
      await fetchBrands()
    } else {
      const errorData = await response.json()
      alert(`Failed to save brand: ${errorData.error}`)
    }
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <header className="flex flex-wrap gap-4 justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <Button onClick={handleAddBrand}>Add New Brand</Button>
      </header>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
          <p className="font-bold">Dashboard Error</p>
          <p>{error}</p>
        </div>
      )}

      <Tabs defaultValue="brands">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="brands">Brands</TabsTrigger>
          <TabsTrigger value="submissions">Submissions</TabsTrigger>
        </TabsList>
        <TabsContent value="brands" className="mt-4">
          <BrandGrid brands={brands} onEdit={handleEditBrand} onDelete={handleDeleteBrand} />
        </TabsContent>
        <TabsContent value="submissions" className="mt-4">
          <SubmissionsTable submissions={initialSubmissions} />
        </TabsContent>
      </Tabs>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-3xl h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{selectedBrand ? "Edit Brand" : "Add New Brand"}</DialogTitle>
            <DialogDescription>
              Fill in the details for the brand below. You can use the AI fetcher to automatically populate fields from
              a website.
            </DialogDescription>
          </DialogHeader>
          <BrandForm
            brand={selectedBrand}
            uploadedFiles={uploadedFiles}
            onSave={handleSaveBrand}
            onCancel={() => setIsFormOpen(false)}
            onLogoUpload={fetchFiles}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
