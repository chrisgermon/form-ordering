"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { BrandForm } from "./BrandForm"
import type { Brand } from "@/lib/types"
import { deleteBrand } from "./actions"
import { toast } from "sonner"
import { Trash2, Edit } from "lucide-react"
import Link from "next/link"

export function BrandManagement({ brands: initialBrands }: { brands: Brand[] }) {
  const [brands, setBrands] = useState(initialBrands)
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)

  const handleAddNew = () => {
    setEditingBrand(null)
    setIsFormOpen(true)
  }

  const handleEdit = (brand: Brand) => {
    setEditingBrand(brand)
    setIsFormOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this brand?")) {
      const result = await deleteBrand(id)
      if (result.success) {
        setBrands(brands.filter((b) => b.id !== id))
        toast.success("Brand deleted successfully")
      } else {
        toast.error(result.message)
      }
    }
  }

  const onFormSuccess = (updatedBrand: Brand) => {
    if (editingBrand) {
      setBrands(brands.map((b) => (b.id === updatedBrand.id ? updatedBrand : b)))
    } else {
      setBrands([...brands, updatedBrand])
    }
    setIsFormOpen(false)
    setEditingBrand(null)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Brand Management</CardTitle>
        <CardDescription>Add, edit, or delete brands.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex justify-end">
          <Button onClick={handleAddNew}>Add New Brand</Button>
        </div>
        {isFormOpen && (
          <div className="mb-6">
            <BrandForm brand={editingBrand} onSuccess={onFormSuccess} onCancel={() => setIsFormOpen(false)} />
          </div>
        )}
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Logo</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {brands.map((brand) => (
                <TableRow key={brand.id}>
                  <TableCell className="font-medium">{brand.name}</TableCell>
                  <TableCell>{brand.slug}</TableCell>
                  <TableCell>
                    {brand.logo_path && (
                      <img src={brand.logo_path || "/placeholder.svg"} alt={`${brand.name} logo`} className="h-10" />
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/admin/editor/${brand.slug}`}>
                      <Button variant="ghost" size="icon">
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit Form</span>
                      </Button>
                    </Link>
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(brand)}>
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Edit Brand</span>
                    </Button>
                    <Button variant="destructive" size="icon" onClick={() => handleDelete(brand.id)}>
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete Brand</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
