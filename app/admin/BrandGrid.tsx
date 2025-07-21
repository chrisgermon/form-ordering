"use client"

import Image from "next/image"
import Link from "next/link"
import { toast } from "sonner"
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react"

import type { Brand } from "@/lib/types"
import { resolveAssetUrl } from "@/lib/utils"
import { deleteBrand } from "./actions"

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface BrandGridProps {
  brands: Brand[]
  onEditBrand: (brand: Brand) => void
  onBrandChange: () => void
}

export function BrandGrid({ brands, onEditBrand, onBrandChange }: BrandGridProps) {
  const handleDelete = async (brandId: string) => {
    if (window.confirm("Are you sure you want to delete this brand and all its data? This action cannot be undone.")) {
      const result = await deleteBrand(brandId)
      if (result.success) {
        toast.success(result.message)
        onBrandChange()
      } else {
        toast.error(result.message)
      }
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {(brands || []).map((brand) => (
        <Card key={brand.id}>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold">{brand.name}</CardTitle>
            <Badge variant={brand.active ? "default" : "outline"}>{brand.active ? "Active" : "Inactive"}</Badge>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center mb-4 h-20">
              <Image
                src={resolveAssetUrl(brand.logo) || "/placeholder.svg"}
                alt={`${brand.name} logo`}
                width={150}
                height={75}
                className="object-contain h-full w-auto"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/admin/editor/${brand.slug}`}>Edit Form</Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => onEditBrand(brand)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit Brand
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDelete(brand.id)} className="text-red-600">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
