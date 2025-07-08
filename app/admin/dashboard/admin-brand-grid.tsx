"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { PlusCircle, Edit, FileText, Trash2, ExternalLink } from "lucide-react"
import { BrandForm } from "./BrandForm"
import type { Brand, UploadedFile } from "@/lib/types"
import { resolveAssetUrl } from "@/lib/utils"
import { toast } from "sonner"

interface AdminBrandGridProps {
  initialBrands: Brand[]
  uploadedFiles: UploadedFile[]
}

export default function AdminBrandGrid({ initialBrands, uploadedFiles }: AdminBrandGridProps) {
  const [brands, setBrands] = useState(initialBrands)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null)
  const router = useRouter()

  useEffect(() => {
    setBrands(initialBrands)
  }, [initialBrands])

  const handleAddNew = () => {
    setSelectedBrand(null)
    setIsFormOpen(true)
  }

  const handleEdit = (brand: Brand) => {
    setSelectedBrand(brand)
    setIsFormOpen(true)
  }

  const handleDelete = async (brandId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this brand and all its associated forms and submissions? This action cannot be undone.",
      )
    ) {
      return
    }

    try {
      const response = await fetch(`/api/admin/brands?id=${brandId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const { error } = await response.json()
        throw new Error(error || "Failed to delete brand.")
      }

      setBrands(brands.filter((b) => b.id !== brandId))
      toast.success("Brand deleted successfully.")
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An unknown error occurred.")
    }
  }

  const handleSave = async (formData: any) => {
    const isNew = !selectedBrand
    const url = isNew ? "/api/admin/brands" : "/api/admin/brands"
    const method = isNew ? "POST" : "PUT"

    try {
      const response = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || `Failed to ${isNew ? "create" : "update"} brand.`)
      }

      if (isNew) {
        setBrands([...brands, result])
      } else {
        setBrands(brands.map((b) => (b.id === result.id ? result : b)))
      }

      toast.success(`Brand ${isNew ? "created" : "updated"} successfully.`)
      setIsFormOpen(false)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An unknown error occurred.")
    }
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button onClick={handleAddNew}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Brand
        </Button>
      </div>
      <div className="border rounded-lg bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Brand</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Public Form</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {brands.map((brand) => (
              <TableRow key={brand.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-3">
                    <img
                      src={resolveAssetUrl(brand.logo) || "/placeholder.svg"}
                      alt={`${brand.name} Logo`}
                      className="h-8 w-12 object-contain bg-gray-100 rounded-sm p-1"
                      crossOrigin="anonymous"
                    />
                    <span>{brand.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={brand.active ? "default" : "secondary"}>{brand.active ? "Active" : "Inactive"}</Badge>
                </TableCell>
                <TableCell>
                  <Button variant="link" asChild className="p-0 h-auto">
                    <Link href={`/forms/${brand.slug}`} target="_blank" rel="noopener noreferrer">
                      View Form <ExternalLink className="ml-2 h-3 w-3" />
                    </Link>
                  </Button>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(brand)}>
                      <Edit className="mr-2 h-3 w-3" />
                      Edit Brand
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/admin/editor/${brand.slug}`}>
                        <FileText className="mr-2 h-3 w-3" />
                        Edit Form
                      </Link>
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(brand.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedBrand ? "Edit Brand" : "Add New Brand"}</DialogTitle>
            <DialogDescription>
              {selectedBrand ? `Editing details for ${selectedBrand.name}.` : "Create a new brand for the system."}
            </DialogDescription>
          </DialogHeader>
          <BrandForm
            brand={selectedBrand}
            uploadedFiles={uploadedFiles}
            onSave={handleSave}
            onCancel={() => setIsFormOpen(false)}
            onLogoUpload={() => router.refresh()}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
