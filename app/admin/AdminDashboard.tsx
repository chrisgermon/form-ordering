"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"

import { BrandGrid } from "./BrandGrid"
import { BrandForm } from "./BrandForm"
import { SubmissionsTable } from "./SubmissionsTable"
import { FileManager } from "./FileManager"

import type { Brand, Submission, BrandFile } from "@/lib/types"

export function AdminDashboard({
  brands,
  submissions,
  files,
}: {
  brands: Brand[]
  submissions: Submission[]
  files: BrandFile[]
}) {
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const router = useRouter()

  const handleBrandChange = () => {
    router.refresh()
  }

  const handleEditBrand = (brand: Brand) => {
    setSelectedBrand(brand)
    setIsFormOpen(true)
  }

  const handleAddNewBrand = () => {
    setSelectedBrand(null)
    setIsFormOpen(true)
  }

  const handleCloseForm = () => {
    setIsFormOpen(false)
    setSelectedBrand(null)
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
          <BrandGrid
            brands={brands}
            onEditBrand={handleEditBrand}
            onBrandChange={handleBrandChange}
          />
        </TabsContent>
        <TabsContent value="submissions">
          <SubmissionsTable submissions={submissions} />
        </TabsContent>
        <TabsContent value="files">
          <FileManager initialFiles={files} brands={brands} />
        </TabsContent>
      </Tabs>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{selectedBrand ? "Edit Brand" : "Create New Brand"}</DialogTitle>
          </DialogHeader>
          <BrandForm brand={selectedBrand} onClose={handleCloseForm} />
        </DialogContent>
      </Dialog>
    </div>
  )
}
