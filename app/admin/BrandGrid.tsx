"use client"

import Image from "next/image"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { Brand } from "@/lib/types"
import { BrandForm } from "./BrandForm"
import { Pencil } from "lucide-react"

interface BrandGridProps {
  brands: Brand[]
}

export function BrandGrid({ brands }: BrandGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {brands.map((brand) => (
        <Card key={brand.id} className="flex flex-col">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{brand.name}</CardTitle>
            <Badge variant={brand.active ? "default" : "destructive"}>{brand.active ? "Active" : "Inactive"}</Badge>
          </CardHeader>
          <CardContent className="flex-grow flex flex-col items-center justify-center">
            <div className="relative w-32 h-32 mb-4">
              <Image
                src={brand.logo || "/placeholder-logo.svg"}
                alt={`${brand.name} Logo`}
                layout="fill"
                objectFit="contain"
              />
            </div>
            <div className="flex w-full gap-2 mt-auto">
              <Button asChild variant="outline" className="flex-1 bg-transparent">
                <Link href={`/admin/editor/${brand.slug}`}>Edit Form</Link>
              </Button>
              <BrandForm brand={brand}>
                <Button variant="ghost" size="icon">
                  <Pencil className="h-4 w-4" />
                </Button>
              </BrandForm>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
