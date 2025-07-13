"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import { BrandForm } from "./BrandForm"
import { BrandGrid } from "./BrandGrid"
import { SubmissionsTable } from "./SubmissionsTable"
import { FileManager } from "./FileManager"
import type { Brand, FormSubmission, FileRecord } from "@/lib/types"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

interface AdminDashboardProps {
  initialBrands: Brand[]
  initialSubmissions: FormSubmission[]
  initialFiles: FileRecord[]
  error?: string | null
}

export function AdminDashboard({ initialBrands, initialSubmissions, initialFiles, error }: AdminDashboardProps) {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null)

  const handleEditBrand = (brand: Brand) => {
    setEditingBrand(brand)
    setIsFormOpen(true)
  }

  const handleAddNewBrand = () => {
    setEditingBrand(null)
    setIsFormOpen(true)
  }

  const handleCloseForm = () => {
    setIsFormOpen(false)
    setEditingBrand(null)
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Dashboard</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <>
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <Tabs defaultValue="brands">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <TabsList>
              <TabsTrigger value="brands">Brands</TabsTrigger>
              <TabsTrigger value="files">Files</TabsTrigger>
              <TabsTrigger value="submissions">Submissions</TabsTrigger>
            </TabsList>
            <Button onClick={handleAddNewBrand}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add New Brand
            </Button>
          </div>
          <TabsContent value="brands">
            <BrandGrid brands={initialBrands} onEdit={handleEditBrand} />
          </TabsContent>
          <TabsContent value="files">
            <FileManager brands={initialBrands} />
          </TabsContent>
          <TabsContent value="submissions">
            <SubmissionsTable submissions={initialSubmissions} />
          </TabsContent>
        </Tabs>
      </div>
      <BrandForm isOpen={isFormOpen} onClose={handleCloseForm} brand={editingBrand} />
    </>
  )
}
