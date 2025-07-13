"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import { BrandGrid } from "./BrandGrid"
import { BrandForm } from "./BrandForm"
import { SubmissionsTable } from "./SubmissionsTable"
import { FileManager } from "./FileManager"
import type { Brand } from "@/lib/types"
import { getBrands, getSubmissions, getFiles } from "./data-access"

type AdminDashboardProps = {
  initialBrands: Brand[]
  initialSubmissions: any[]
  initialFiles: any[]
}

export function AdminDashboard({ initialBrands, initialSubmissions, initialFiles }: AdminDashboardProps) {
  const [brands, setBrands] = useState(initialBrands)
  const [submissions, setSubmissions] = useState(initialSubmissions)
  const [files, setFiles] = useState(initialFiles)
  const [isFormOpen, setIsFormOpen] = useState(false)

  useEffect(() => {
    setBrands(initialBrands)
  }, [initialBrands])

  useEffect(() => {
    setSubmissions(initialSubmissions)
  }, [initialSubmissions])

  useEffect(() => {
    setFiles(initialFiles)
  }, [initialFiles])

  const handleDataRefresh = async () => {
    const [brandsData, submissionsData, filesData] = await Promise.all([getBrands(), getSubmissions(), getFiles()])
    setBrands(brandsData)
    setSubmissions(submissionsData)
    setFiles(filesData)
  }

  return (
    <div className="container mx-auto py-8">
      <Tabs defaultValue="brands">
        <div className="flex justify-between items-center mb-6">
          <TabsList>
            <TabsTrigger value="brands">Brands</TabsTrigger>
            <TabsTrigger value="submissions">Submissions</TabsTrigger>
            <TabsTrigger value="files">Files</TabsTrigger>
          </TabsList>
          <Button onClick={() => setIsFormOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add New Brand
          </Button>
        </div>
        <TabsContent value="brands">
          <BrandGrid brands={brands} onBrandChange={handleDataRefresh} />
        </TabsContent>
        <TabsContent value="submissions">
          <SubmissionsTable submissions={submissions} />
        </TabsContent>
        <TabsContent value="files">
          <FileManager files={files} onFileChange={handleDataRefresh} />
        </TabsContent>
      </Tabs>

      <BrandForm isOpen={isFormOpen} onOpenChange={setIsFormOpen} onFormSuccess={handleDataRefresh} brand={null} />
    </div>
  )
}
