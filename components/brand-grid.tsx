import Link from "next/link"
import Image from "next/image"

interface Brand {
  id: string
  name: string
  slug: string
  logo: string | null
}

interface BrandGridProps {
  brands: (Brand | null | undefined)[]
}

export function BrandGrid({ brands }: BrandGridProps) {
  // Filter out any null or undefined brand objects to prevent runtime errors.
  const validBrands = brands ? brands.filter((brand): brand is Brand => !!brand && !!brand.id) : []

  if (validBrands.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500">No brands are available at the moment.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
      {validBrands.map((brand) => (
        <Link
          href={`/forms/${brand.slug}`}
          key={brand.id}
          className="group relative flex flex-col items-center justify-center rounded-lg border border-gray-200 bg-white p-8 shadow-sm transition-all hover:shadow-lg hover:-translate-y-1"
        >
          {brand.logo ? (
            <Image
              src={brand.logo || "/placeholder.svg"}
              alt={`${brand.name} Logo`}
              width={200}
              height={100}
              className="h-24 w-auto object-contain"
            />
          ) : (
            <div className="flex h-24 items-center justify-center">
              <span className="text-2xl font-bold text-gray-700">{brand.name}</span>
            </div>
          )}
          <span className="mt-6 text-lg font-semibold text-gray-800">{brand.name}</span>
        </Link>
      ))}
    </div>
  )
}
