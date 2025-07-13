"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import type { Brand } from "@/lib/types"
import Image from "next/image"
import Link from "next/link"
import { Pencil, Trash2 } from "lucide-react"

interface BrandGridProps {
  brands: Brand[]
  onEdit: (brand: Brand) => void
  onDelete: (brandId: string) => void
}

export function BrandGrid({ brands, onEdit, onDelete }: BrandGridProps) {
  if (!brands || brands.length === 0) {
    return <p className="text-center text-gray-500 mt-8">No brands found. Add one to get started.</p>
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {brands.map((brand) => (
        <Card key={brand.id} className="flex flex-col">
          <CardHeader className="flex flex-row items-start gap-4">
            {brand.logo && (
              <Image
                src={brand.logo || "/placeholder.svg"}
                alt={`${brand.name} logo`}
                width={48}
                height={48}
                className="rounded-md object-contain border"
              />
            )}
            <div className="flex-1">
              <CardTitle>{brand.name}</CardTitle>
              <CardDescription>{brand.slug}</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="flex-grow">
            <p className={`text-sm font-medium ${brand.active ? "text-green-600" : "text-gray-500"}`}>
              {brand.active ? "Active" : "Inactive"}
            </p>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Link href={`/admin/editor/${brand.slug}`} passHref>
              <Button variant="outline">Edit Form</Button>
            </Link>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" onClick={() => onEdit(brand)}>
                <Pencil className="h-4 w-4" />
                <span className="sr-only">Edit Brand</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-red-500 hover:text-red-600"
                onClick={() => onDelete(brand.id)}
              >
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Delete Brand</span>
              </Button>
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
