"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import Image from "next/image"
import type { Brand } from "@/lib/types"
import { Button } from "@/components/ui/button"

interface BrandGridProps {
  brands: Brand[]
}

export function BrandGrid({ brands }: BrandGridProps) {
  if (!brands || brands.length === 0) {
    return (
      <div className="col-span-full text-center py-12">
        <p className="text-gray-500 text-lg mb-4">No brands available at the moment.</p>
        <p className="text-gray-400">Please check back later or contact support.</p>
      </div>
    )
  }

  return (
    <>
      {brands.map((brand) => (
        <Card key={brand.id} className="overflow-hidden transition-all hover:shadow-xl h-full flex flex-col">
          <Link href={`/forms/${brand.slug}`} className="group block flex-grow">
            <CardContent className="flex flex-col items-center justify-between p-6 space-y-4 h-full text-center">
              <div className="relative w-48 h-24 flex-shrink-0">
                <Image
                  src={brand.logo || "/placeholder.svg?height=96&width=192&query=Logo"}
                  alt={`${brand.name} Logo`}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-contain"
                />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 pt-4">{brand.name}</h3>
            </CardContent>
          </Link>
          <div className="p-4 pt-0">
            <Link href={`/forms/${brand.slug}`} className="w-full">
              <Button className="w-full">Create Order</Button>
            </Link>
          </div>
        </Card>
      ))}
    </>
  )
}

export default BrandGrid
