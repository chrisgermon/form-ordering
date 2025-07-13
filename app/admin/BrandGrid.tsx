"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Edit, Trash2, ExternalLink } from "lucide-react"
import { BrandForm } from "./BrandForm"
import { deleteBrand } from "./actions"
import { toast } from "sonner"
import { resolveAssetUrl } from "@/lib/utils"
import type { Brand } from "@/lib/types"

interface BrandGridProps {
  brands: Brand[]
  onBrandChange: () => Promise<void>
}

export function BrandGrid({ brands, onBrandChange }: BrandGridProps) {
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null)

  const handleEdit = (brand: Brand) => {
    setEditingBrand(brand)
  }

  const handleDelete = async (brandId: string) => {
    if (window.confirm("Are you sure you want to delete this brand and all associated data? This cannot be undone.")) {
      const result = await deleteBrand(Number.parseInt(brandId, 10))
      if (result.success) {
        toast.success("Brand deleted successfully.")
        await onBrandChange()
      } else {
        toast.error(`Failed to delete brand: ${result.message}`)
      }
    }
  }

  const handleCloseForm = () => {
    setEditingBrand(null)
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {Array.isArray(brands) && brands.length > 0 ? (
          brands.map((brand) => (
            <Card key={brand.id} className="flex flex-col">
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle className="text-lg">{brand.name}</CardTitle>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEdit(brand)}>
                      <Edit className="mr-2 h-4 w-4" />
                      <span>Edit</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDelete(brand.id)} className="text-red-500">
                      <Trash2 className="mr-2 h-4 w-4" />
                      <span>Delete</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent className="flex-grow flex flex-col items-center justify-center">
                <Image
                  src={resolveAssetUrl(brand.logo) || "/placeholder.svg"}
                  alt={`${brand.name} logo`}
                  width={128}
                  height={128}
                  className="rounded-md object-contain"
                />
              </CardContent>
              <CardFooter>
                <Button asChild variant="outline" className="w-full bg-transparent">
                  <Link href={`/admin/editor/${brand.slug}`}>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Open Editor
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))
        ) : (
          <p className="col-span-full text-center text-gray-500">No brands found. Add one to get started.</p>
        )}
      </div>
      {editingBrand && (
        <BrandForm isOpen={true} onOpenChange={handleCloseForm} brand={editingBrand} onFormSuccess={onBrandChange} />
      )}
    </>
  )
}
