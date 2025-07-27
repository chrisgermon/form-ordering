import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import Image from "next/image"
import type { Brand } from "@/lib/types"

interface BrandGridProps {
  brands: Brand[]
}

export function BrandGrid({ brands }: BrandGridProps) {
  return (
    <>
      {brands.map((brand) => (
        <Link key={brand.id} href={`/forms/${brand.slug}`} className="group block">
          <Card className="overflow-hidden transition-all group-hover:scale-105 group-hover:shadow-lg h-full">
            <CardContent className="flex flex-col items-center justify-center p-6 space-y-4 h-full">
              <div className="relative w-full h-24">
                <Image
                  src={brand.logo_url || "/placeholder-logo.svg"}
                  alt={`${brand.name} Logo`}
                  fill
                  className="object-contain"
                />
              </div>
              <h3 className="text-lg font-semibold text-center pt-4">{brand.name}</h3>
            </CardContent>
          </Card>
        </Link>
      ))}
    </>
  )
}

export default BrandGrid
