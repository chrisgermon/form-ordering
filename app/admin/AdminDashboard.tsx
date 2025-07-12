"use client"

import { useState, useCallback } from "react"
import { BrandGrid } from "./BrandGrid"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { BrandForm } from "./BrandForm"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SubmissionsTable } from "./SubmissionsTable"
import { FileManager } from "./FileManager"
import { SystemActions } from "./system-actions"
import type { Brand, UploadedFile, FormSubmission } from "@/lib/types"

interface AdminDashboardProps {
  brands: Brand[]
  submissions: FormSubmission[]
  files: UploadedFile[]
}

export function AdminDashboard({ brands, submissions, files }: AdminDashboardProps) {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null)

  const fetchBrands = useCallback(async () => {
    const response = await fetch("/api/admin/brands")
    if (response.ok) {
      const data = await response.json()
      // Assuming there's a way to update the brands state from here
    }
  }, [])

  const fetchFiles = useCallback(async () => {
    const response = await fetch("/api/admin/files")
    if (response.ok) {
      const data = await response.json()
      // Assuming there's a way to update the files state from here
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

      <Tabs defaultValue="brands" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="brands">Brands</TabsTrigger>
          <TabsTrigger value="submissions">Submissions</TabsTrigger>
          <TabsTrigger value="files">File Manager</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>
        <TabsContent value="brands" className="mt-4">
          <BrandGrid brands={brands} onEdit={handleEditBrand} onDelete={handleDeleteBrand} />
        </TabsContent>
        <TabsContent value="submissions" className="mt-4">
          <SubmissionsTable submissions={submissions} brands={brands} />
        </TabsContent>
        <TabsContent value="files" className="mt-4">
          <FileManager files={files} />
        </TabsContent>
        <TabsContent value="system" className="mt-4">
          <SystemActions />
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
            files={files}
            onSave={handleSaveBrand}
            onCancel={() => setIsFormOpen(false)}
            onFilesUpdate={fetchFiles}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
