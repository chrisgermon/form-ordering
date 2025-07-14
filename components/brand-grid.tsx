"use client"

import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Image from "next/image"

interface Brand {
  id: string
  name: string
  slug: string
  logo: string | null
}

interface BrandGridProps {
  brands: Brand[]
}

export function BrandGrid({ brands }: BrandGridProps) {
  const router = useRouter()

  const handleBrandClick = (slug: string) => {
    router.push(`/forms/${slug}`)
  }

  if (!brands || brands.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg mb-4">No brands available at the moment.</p>
        <p className="text-gray-400">Please check back later or contact support.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {brands.map((brand) => (
        <Card
          key={brand.id}
          className="hover:shadow-lg transition-shadow cursor-pointer group"
          onClick={() => handleBrandClick(brand.slug)}
        >
          <CardContent className="p-6 flex flex-col items-center justify-between text-center space-y-4 h-full">
            <div className="relative w-48 h-24 flex-shrink-0">
              <Image
                src={brand.logo || "/placeholder.svg?height=96&width=192&query=Logo"}
                alt={`${brand.name} Logo`}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-contain"
              />
            </div>
            <div className="w-full">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">{brand.name}</h3>
              <Button className="w-full bg-blue-600 hover:bg-blue-700">Create Order</Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
