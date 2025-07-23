import Image from "next/image"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import type { Brand } from "@/lib/types"

interface BrandGridProps {
  brands: Brand[]
}

export default function BrandGrid({ brands }: BrandGridProps) {
  return (
    <div className="w-full max-w-4xl">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
        {brands.map((brand) => (
          <Link key={brand.id} href={`/forms/${brand.slug}`} passHref>
            <Card className="cursor-pointer hover:shadow-lg transition-shadow duration-200 h-full">
              <CardContent className="flex flex-col items-center justify-center p-6 h-full">
                <div className="relative w-32 h-32">
                  <Image
                    src={brand.logo || "/placeholder-logo.svg"}
                    alt={`${brand.name} Logo`}
                    layout="fill"
                    objectFit="contain"
                  />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
