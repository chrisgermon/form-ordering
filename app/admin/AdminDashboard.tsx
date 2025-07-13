"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BrandGrid } from "./BrandGrid"
import { SubmissionsTable } from "./SubmissionsTable"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import type { Brand, FormSubmission, FileRecord } from "@/lib/types"

interface AdminDashboardProps {
  initialBrands: Brand[]
  initialSubmissions: FormSubmission[]
  initialFiles: FileRecord[]
  error: string | null
}

export function AdminDashboard({ initialBrands, initialSubmissions, initialFiles, error }: AdminDashboardProps) {
  const [brands, setBrands] = useState<Brand[]>(initialBrands)
  const [submissions, setSubmissions] = useState<FormSubmission[]>(initialSubmissions)

  const handleBrandUpdate = (updatedBrand: Brand) => {
    setBrands((prevBrands) => prevBrands.map((b) => (b.id === updatedBrand.id ? updatedBrand : b)))
  }

  const handleBrandAdd = (newBrand: Brand) => {
    setBrands((prevBrands) => [...prevBrands, newBrand].sort((a, b) => a.name.localeCompare(b.name)))
  }

  const handleBrandDelete = (brandId: string) => {
    setBrands((prevBrands) => prevBrands.filter((b) => b.id !== brandId))
  }

  return (
    <div className="container mx-auto p-4 md:p-6">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="brands">
        <TabsList className="grid w-full grid-cols-2 md:w-[400px]">
          <TabsTrigger value="brands">Brands</TabsTrigger>
          <TabsTrigger value="submissions">Submissions</TabsTrigger>
        </TabsList>
        <TabsContent value="brands">
          <BrandGrid
            initialBrands={brands}
            onBrandUpdate={handleBrandUpdate}
            onBrandAdd={handleBrandAdd}
            onBrandDelete={handleBrandDelete}
          />
        </TabsContent>
        <TabsContent value="submissions">
          <SubmissionsTable initialSubmissions={submissions} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
