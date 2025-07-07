"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { BrandForm } from "./BrandForm"
import { deleteBrand } from "./actions"
import type { Brand } from "@/lib/types"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export function BrandManagement({ initialBrands }: { initialBrands: Brand[] }) {
  const [brands, setBrands] = useState(initialBrands)
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null)
  const router = useRouter()

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this brand?")) {
      const result = await deleteBrand(id)
      if (result.success) {
        toast.success(result.message)
        setBrands(brands.filter((b) => b.id !== id))
      } else {
        toast.error(result.message)
      }
    }
  }

  const handleFormSuccess = () => {
    setEditingBrand(null)
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <BrandForm brand={editingBrand} onSuccess={handleFormSuccess} />
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {brands.map((brand) => (
              <TableRow key={brand.id}>
                <TableCell>{brand.name}</TableCell>
                <TableCell className="font-mono">/forms/{brand.slug}</TableCell>
                <TableCell>{brand.active ? "Active" : "Inactive"}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="outline" size="sm" onClick={() => setEditingBrand(brand)}>
                    Edit
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(brand.id)}>
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
