import Image from "next/image"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import type { Brand } from "@/lib/types"
import { resolveAssetUrl } from "@/lib/utils"

interface BrandGridProps {
  brands: Pick<Brand, "id" | "name" | "slug" | "logo_url">[]
}

export function BrandGrid({ brands }: BrandGridProps) {
  if (!brands || brands.length === 0) {
    return (
      <div className="text-center text-gray-500">
        <p>No active brands found.</p>
        <p className="text-sm mt-2">Please check back later or contact support.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {brands.map((brand) => (
        <Link href={`/forms/${brand.slug}`} key={brand.id} className="group">
          <Card className="overflow-hidden transition-all duration-300 ease-in-out hover:shadow-xl hover:-translate-y-1">
            <CardContent className="p-6 flex flex-col items-center justify-center text-center">
              <div className="relative w-full h-24 mb-4">
                {brand.logo_url ? (
                  <Image
                    src={resolveAssetUrl(brand.logo_url) || "/placeholder.svg"}
                    alt={`${brand.name} Logo`}
                    fill
                    style={{ objectFit: "contain" }}
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 rounded-md flex items-center justify-center">
                    <span className="text-sm text-gray-500">No Logo</span>
                  </div>
                )}
              </div>
              <h2 className="text-lg font-semibold text-gray-800 truncate">{brand.name}</h2>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}
