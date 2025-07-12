"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { resolveAssetUrl } from "@/lib/utils"
import type { Brand } from "@/lib/types"
import { Edit, Trash2 } from "lucide-react"

interface BrandGridProps {
  brands: Brand[]
  onEdit: (brand: Brand) => void
  onDelete: (brandId: string) => void
}

export function BrandGrid({ brands, onEdit, onDelete }: BrandGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {brands.map((brand) => (
        <Card key={brand.id} className="flex flex-col bg-white shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex justify-between items-start gap-2">
              <CardTitle className="text-lg leading-tight">{brand.name}</CardTitle>
              <Badge variant={brand.active ? "default" : "secondary"} className="shrink-0">
                {brand.active ? "Active" : "Inactive"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="flex-grow flex flex-col items-center gap-4">
            <div className="flex justify-center items-center h-24 w-full bg-gray-50 rounded-md p-2 mb-2">
              <Image
                src={resolveAssetUrl(brand.logo) || "/placeholder.svg"}
                alt={`${brand.name} Logo`}
                width={150}
                height={150}
                className="h-16 w-auto object-contain"
              />
            </div>
            <Button asChild variant="outline" className="w-full bg-transparent">
              <Link href={`/admin/editor/${brand.slug}`}>
                <Edit className="mr-2 h-4 w-4" />
                Open Editor
              </Link>
            </Button>
          </CardContent>
          <CardFooter className="grid grid-cols-2 gap-2 pt-4 border-t">
            <Button variant="ghost" className="w-full" onClick={() => onEdit(brand)}>
              <Edit className="mr-2 h-4 w-4" />
              Settings
            </Button>
            <Button variant="destructive" className="w-full" onClick={() => onDelete(brand.id)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
