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

export function AdminDashboard({
  brands: initialBrands,
  files: initialFiles,
  submissions: initialSubmissions,
}: AdminDashboardProps) {
  const [isBrandFormOpen, setIsBrandFormOpen] = useState(false)

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <Button onClick={() => setIsBrandFormOpen(true)}>
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
          <BrandGrid brands={initialBrands} />
        </TabsContent>
        <TabsContent value="files" className="mt-4">
          <FileManager brands={initialBrands} />
        </TabsContent>
        <TabsContent value="submissions" className="mt-4">
          <SubmissionsTable submissions={initialSubmissions} brands={initialBrands} />
        </TabsContent>
      </Tabs>

      {isBrandFormOpen && <BrandForm isOpen={isBrandFormOpen} onClose={() => setIsBrandFormOpen(false)} />}
    </>
  )
}
