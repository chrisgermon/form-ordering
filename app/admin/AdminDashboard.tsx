"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import type { Brand, FileRecord, Submission } from "@/lib/types"
import { BrandGrid } from "./BrandGrid"
import { BrandForm } from "./BrandForm"
import { FileManager } from "./FileManager"
import { SubmissionsTable } from "./SubmissionsTable"

interface AdminDashboardProps {
  brands: Brand[]
  files: FileRecord[]
  submissions: Submission[]
}

export default function AdminDashboard({
  brands: initialBrands,
  files: initialFiles,
  submissions: initialSubmissions,
}: AdminDashboardProps) {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null)
  const [brands, setBrands] = useState<Brand[]>(initialBrands || [])
  // You might want to refresh files and submissions as well
  // const [files, setFiles] = useState<FileRecord[]>(initialFiles || [])
  // const [submissions, setSubmissions] = useState<Submission[]>(initialSubmissions || [])

  const refreshData = async () => {
    const res = await fetch("/api/admin/brands")
    if (res.ok) {
      const updatedBrands = await res.json()
      setBrands(updatedBrands)
    }
    // Add fetching for files and submissions if needed
  }

  const handleAddNewBrand = () => {
    setEditingBrand(null)
    setIsFormOpen(true)
  }

  const handleEditBrand = (brand: Brand) => {
    setEditingBrand(brand)
    setIsFormOpen(true)
  }

  const handleFormSuccess = () => {
    setIsFormOpen(false)
    setEditingBrand(null)
    refreshData()
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <Button onClick={handleAddNewBrand}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add New Brand
        </Button>
      </div>

      <Tabs defaultValue="brands">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="brands">Brands</TabsTrigger>
          <TabsTrigger value="files">File Manager</TabsTrigger>
          <TabsTrigger value="submissions">Submissions</TabsTrigger>
        </TabsList>
        <TabsContent value="brands" className="mt-4">
          <BrandGrid brands={brands} onEditBrand={handleEditBrand} onBrandChange={refreshData} />
        </TabsContent>
        <TabsContent value="files" className="mt-4">
          <FileManager brands={brands} />
        </TabsContent>
        <TabsContent value="submissions" className="mt-4">
          <SubmissionsTable submissions={initialSubmissions} brands={brands} />
        </TabsContent>
      </Tabs>

      {isFormOpen && (
        <BrandForm
          isOpen={isFormOpen}
          onOpenChange={setIsFormOpen}
          brand={editingBrand}
          onFormSuccess={handleFormSuccess}
        />
      )}
    </>
  )
}
