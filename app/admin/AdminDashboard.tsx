"use client"

import { useState } from "react"
import type { Brand, Submission, File as DbFile } from "@/lib/types"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import BrandGrid from "./BrandGrid"
import SubmissionsTable from "./SubmissionsTable"
import FileManager from "./FileManager"
import BrandForm from "./BrandForm"

interface AdminDashboardProps {
  initialBrands: Brand[]
  initialSubmissions: Submission[]
  initialFiles: DbFile[]
}

export default function AdminDashboard({ initialBrands, initialSubmissions, initialFiles }: AdminDashboardProps) {
  const [brands, setBrands] = useState<Brand[]>(initialBrands)
  const [submissions, setSubmissions] = useState<Submission[]>(initialSubmissions)
  const [files, setFiles] = useState<DbFile[]>(initialFiles)

  const onBrandCreated = (newBrand: Brand) => {
    setBrands((prevBrands) => [...prevBrands, newBrand].sort((a, b) => a.name.localeCompare(b.name)))
  }

  const onBrandUpdated = (updatedBrand: Brand) => {
    setBrands((prevBrands) => prevBrands.map((b) => (b.id === updatedBrand.id ? updatedBrand : b)))
  }

  const onBrandDeleted = (brandId: string) => {
    setBrands((prevBrands) => prevBrands.filter((b) => b.id !== brandId))
  }

  const onFileUploaded = (newFile: DbFile) => {
    setFiles((prevFiles) => [newFile, ...prevFiles])
  }

  const onFileDeleted = (fileId: string) => {
    setFiles((prevFiles) => prevFiles.filter((f) => f.id !== fileId))
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      <Tabs defaultValue="brands">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="brands">Brands</TabsTrigger>
          <TabsTrigger value="submissions">Submissions</TabsTrigger>
          <TabsTrigger value="files">File Manager</TabsTrigger>
        </TabsList>
        <TabsContent value="brands">
          <div className="mt-6">
            <h2 className="text-2xl font-semibold mb-4">Create New Brand</h2>
            <BrandForm onBrandCreated={onBrandCreated} />
          </div>
          <div className="mt-8">
            <h2 className="text-2xl font-semibold mb-4">Manage Brands</h2>
            <BrandGrid brands={brands} onBrandUpdated={onBrandUpdated} onBrandDeleted={onBrandDeleted} />
          </div>
        </TabsContent>
        <TabsContent value="submissions">
          <SubmissionsTable submissions={submissions} />
        </TabsContent>
        <TabsContent value="files">
          <FileManager files={files} onFileUploaded={onFileUploaded} onFileDeleted={onFileDeleted} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
