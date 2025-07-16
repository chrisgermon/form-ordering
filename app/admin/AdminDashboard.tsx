"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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

export default function AdminDashboard({ brands: initialBrands, files, submissions }: AdminDashboardProps) {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null)
  const [brands, setBrands] = useState<Brand[]>(initialBrands || [])

  const refreshData = async () => {
    const res = await fetch("/api/admin/brands")
    if (res.ok) {
      const updatedBrands = await res.json()
      setBrands(updatedBrands)
    }
  }

  const handleAddNewBrand = () => {
    setSelectedBrand(null)
    setIsFormOpen(true)
  }

  const handleEditBrand = (brand: Brand) => {
    setSelectedBrand(brand)
    setIsFormOpen(true)
  }

  const handleCloseForm = () => {
    setIsFormOpen(false)
    setSelectedBrand(null)
    refreshData()
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="brands">
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="brands">Brands</TabsTrigger>
            <TabsTrigger value="submissions">Submissions</TabsTrigger>
            <TabsTrigger value="files">File Manager</TabsTrigger>
          </TabsList>
          <Button onClick={handleAddNewBrand}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add New Brand
          </Button>
        </div>
        <TabsContent value="brands">
          <BrandGrid brands={brands} onEditBrand={handleEditBrand} onBrandChange={refreshData} />
        </TabsContent>
        <TabsContent value="submissions">
          <SubmissionsTable submissions={submissions} brands={brands} />
        </TabsContent>
        <TabsContent value="files">
          <FileManager files={files} brands={brands} />
        </TabsContent>
      </Tabs>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{selectedBrand ? "Edit Brand" : "Create New Brand"}</DialogTitle>
          </DialogHeader>
          <BrandForm brand={selectedBrand} onFormSuccess={handleCloseForm} />
        </DialogContent>
      </Dialog>
    </div>
  )
}
