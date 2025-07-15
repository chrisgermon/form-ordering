import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { resolveAssetUrl } from "@/lib/utils"

interface Brand {
  id: string
  name: string
  slug: string
  logo: string
  active: boolean
}

interface BrandGridProps {
  brands: Brand[]
}

export function BrandGrid({ brands }: BrandGridProps) {
  return (
    <div className="flex justify-center">
      <div className="flex flex-wrap justify-center gap-6">
        {brands.map((brand) => (
          <Card key={brand.id} className="w-full max-w-sm text-center transition-all hover:shadow-xl">
            <CardHeader className="pb-4">
              <CardTitle>{brand.name}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              <div className="flex justify-center items-center h-24 w-full bg-gray-100 rounded-md p-2 mb-2">
                <img
                  src={resolveAssetUrl(brand.logo) || "/placeholder.svg"}
                  alt={`${brand.name} Logo`}
                  className="h-16 w-auto object-contain"
                />
              </div>
              <Button asChild className="w-full">
                <Link href={`/forms/${brand.slug}`}>View Form</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
