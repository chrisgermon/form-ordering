"use client"
import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Plus, Edit, Eye, Trash2, Settings } from "lucide-react"
import { toast } from "sonner"

import type { Brand, UploadedFile } from "@/lib/types"
import { resolveAssetUrl } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { BrandForm } from "./BrandForm"

interface BrandManagementProps {
  initialBrands: Brand[]
  uploadedFiles: UploadedFile[]
}

export function BrandManagement({ initialBrands, uploadedFiles }: BrandManagementProps) {
  const router = useRouter()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null)

  const handleAddBrand = () => {
    setSelectedBrand(null)
    setIsFormOpen(true)
  }

  const handleEditBrand = (brand: Brand) => {
    setSelectedBrand(brand)
    setIsFormOpen(true)
  }

  const handleFormCancel = () => {
    setIsFormOpen(false)
    setSelectedBrand(null)
  }

  const handleFormSuccess = () => {
    setIsFormOpen(false)
    setSelectedBrand(null)
    router.refresh()
  }

  const handleDeleteBrand = async (brandId: string) => {
    if (!confirm("Are you sure you want to delete this brand and all its data? This cannot be undone.")) return

    toast.loading("Deleting brand...")
    try {
      const response = await fetch(`/api/admin/brands?id=${brandId}`, { method: "DELETE" })
      toast.dismiss()
      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || "Failed to delete brand.")
      }
      toast.success("Brand deleted.")
      router.refresh()
    } catch (error) {
      toast.dismiss()
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred."
      toast.error(errorMessage)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Manage Brands</CardTitle>
        <Button onClick={handleAddBrand}>
          <Plus className="mr-2 h-4 w-4" />
          Add Brand
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {initialBrands.map((brand) => (
            <Card key={brand.id} className="flex flex-col">
              <CardContent className="p-4 flex-grow">
                <div className="relative w-full h-20 mb-4">
                  <Image
                    src={resolveAssetUrl(brand.logo_url) || "/placeholder.svg?width=150&height=80&query=Logo"}
                    alt={`${brand.name} Logo`}
                    fill
                    className="object-contain"
                    crossOrigin="anonymous"
                  />
                </div>
                <h3 className="text-lg font-semibold text-center truncate">{brand.name}</h3>
                <div className="text-center text-sm mt-1">
                  {brand.active ? (
                    <span className="text-green-600 font-medium">Active</span>
                  ) : (
                    <span className="text-red-600 font-medium">Inactive</span>
                  )}
                </div>
              </CardContent>
              <div className="p-2 border-t bg-gray-50 grid grid-cols-2 gap-1">
                <Button variant="outline" size="sm" onClick={() => handleEditBrand(brand)}>
                  <Settings className="mr-1 h-3 w-3" /> Settings
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/admin/editor/${brand.slug}`}>
                    <Edit className="mr-1 h-3 w-3" /> Form
                  </Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/forms/${brand.slug}`} target="_blank">
                    <Eye className="mr-1 h-3 w-3" /> View
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600 bg-transparent"
                  onClick={() => handleDeleteBrand(brand.id)}
                >
                  <Trash2 className="mr-1 h-3 w-3" /> Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
        {initialBrands.length === 0 && <p className="text-center text-muted-foreground py-8">No brands found.</p>}
      </CardContent>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle>{selectedBrand ? "Edit Brand Settings" : "Add New Brand"}</DialogTitle>
          </DialogHeader>
          <BrandForm
            brand={selectedBrand}
            uploadedFiles={uploadedFiles}
            onCancel={handleFormCancel}
            onSuccess={handleFormSuccess}
            onLogoUpload={async () => router.refresh()}
          />
        </DialogContent>
      </Dialog>
    </Card>
  )
}
