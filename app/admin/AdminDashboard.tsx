"use client"

import { useState, useCallback, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BrandGrid } from "./BrandGrid"
import { SubmissionsTable } from "./SubmissionsTable"
import { FileManager } from "./FileManager"
import { AdminDashboardHeader } from "./AdminDashboardHeader"
import { BrandForm } from "./BrandForm"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { Brand, Submission, FileRecord } from "@/lib/types"

type SubmissionWithBrandName = Submission & {
  brand_name: string
}

export function AdminDashboard() {
  const [brands, setBrands] = useState<Brand[]>([])
  const [submissions, setSubmissions] = useState<SubmissionWithBrandName[]>([])
  const [files, setFiles] = useState<FileRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [sortKey, setSortKey] = useState<keyof SubmissionWithBrandName | "brand_name">("created_at")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [brandsRes, submissionsRes, filesRes] = await Promise.all([
        fetch("/api/admin/brands"),
        fetch("/api/admin/submissions"),
        fetch("/api/admin/files"),
      ])

      if (!brandsRes.ok || !submissionsRes.ok || !filesRes.ok) {
        throw new Error("Failed to fetch dashboard data")
      }

      const brandsData = await brandsRes.json()
      const submissionsData = await submissionsRes.json()
      const filesData = await filesRes.json()

      setBrands(brandsData)
      setSubmissions(submissionsData)
      setFiles(filesData)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleSort = (key: keyof SubmissionWithBrandName | "brand_name") => {
    const direction = sortKey === key && sortDirection === "desc" ? "asc" : "desc"
    setSortKey(key)
    setSortDirection(direction)

    const sortedSubmissions = [...submissions].sort((a, b) => {
      const aValue = a[key]
      const bValue = b[key]

      if (aValue < bValue) return direction === "asc" ? -1 : 1
      if (aValue > bValue) return direction === "asc" ? 1 : -1
      return 0
    })
    setSubmissions(sortedSubmissions)
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
    fetchData() // Refetch data when form is closed
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>
  }

  return (
    <div className="space-y-6">
      <AdminDashboardHeader onSubmissionsCleared={fetchData} onAddNewBrand={handleAddNewBrand} />
      <Tabs defaultValue="brands">
        <TabsList>
          <TabsTrigger value="brands">Brands</TabsTrigger>
          <TabsTrigger value="submissions">Submissions</TabsTrigger>
          <TabsTrigger value="files">File Manager</TabsTrigger>
        </TabsList>
        <TabsContent value="brands">
          <BrandGrid brands={brands} onEditBrand={handleEditBrand} />
        </TabsContent>
        <TabsContent value="submissions">
          <SubmissionsTable
            submissions={submissions}
            sortKey={sortKey}
            sortDirection={sortDirection}
            onSort={handleSort}
            isLoading={isLoading}
          />
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
          <BrandForm brand={selectedBrand} onClose={handleCloseForm} />
        </DialogContent>
      </Dialog>
    </div>
  )
}
