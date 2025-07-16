"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PlusCircle } from "lucide-react"
import { BrandGrid } from "./BrandGrid"
import { BrandForm } from "./BrandForm"
import { SubmissionsTable } from "./SubmissionsTable"
import { FileManager } from "./FileManager"
import type { Brand, Submission, FileRecord } from "@/lib/types"

interface AdminDashboardProps {
  brands: Brand[]
  submissions: Submission[]
  files: FileRecord[]
}

export function AdminDashboard({ brands, submissions, files }: AdminDashboardProps) {
  const router = useRouter()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null)

  const handleAddNewBrand = () => {
    setSelectedBrand(null)
    setIsFormOpen(true)
  }

  const handleEditBrand = (brand: Brand) => {
    setSelectedBrand(brand)
    setIsFormOpen(true)
  }

  const handleFormSuccess = () => {
    setIsFormOpen(false)
    setSelectedBrand(null)
    router.refresh()
  }

  const handleBrandChange = () => {
    router.refresh()
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
          <SubmissionsTable submissions={submissions} brands={brands} />
        </TabsContent>
        <TabsContent value="files">
          <FileManager files={files} brands={brands} />
        </TabsContent>
      </Tabs>

      <BrandForm
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        brand={selectedBrand}
        onFormSuccess={handleFormSuccess}
      />
    </div>
  )
}
