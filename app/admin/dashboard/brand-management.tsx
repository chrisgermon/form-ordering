"use client"

import { useState } from "react"
import type { Brand } from "@/lib/types"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { BrandForm } from "./BrandForm"
import { deleteBrand } from "./actions"
import { toast } from "sonner"
import Link from "next/link"

export function BrandManagement({ initialBrands }: { initialBrands: Brand[] }) {
  const [brands, setBrands] = useState<Brand[]>(initialBrands)
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null)

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this brand? This action cannot be undone.")) {
      const result = await deleteBrand(id)
      if (result.success) {
        toast.success(result.message)
        setBrands(brands.filter((b) => b.id !== id))
      } else {
        toast.error(result.message)
      }
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <BrandForm
          brand={editingBrand}
          onSuccess={() => {
            setEditingBrand(null)
            // You might want to refresh the list here
          }}
          key={editingBrand?.id || "new"}
        />
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {brands.map((brand) => (
              <TableRow key={brand.id}>
                <TableCell>{brand.name}</TableCell>
                <TableCell>{brand.slug}</TableCell>
                <TableCell>{brand.active ? "Active" : "Inactive"}</TableCell>
                <TableCell className="space-x-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/admin/editor/${brand.slug}`}>Edit Form</Link>
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setEditingBrand(brand)}>
                    Edit Details
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
