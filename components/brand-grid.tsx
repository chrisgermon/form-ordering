import type { Brand } from "@/lib/types"
import Link from "next/link"
import Image from "next/image"
import { resolveAssetUrl } from "@/lib/utils"

export function BrandGrid({ brands }: { brands: Brand[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {brands.map((brand) => (
        <Link
          key={brand.id}
          href={`/forms/${brand.slug}`}
          className="group block bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md hover:border-blue-500 transition-all duration-300"
        >
          <div className="flex items-center justify-center h-40 p-4 bg-gray-100 rounded-t-lg overflow-hidden">
            {brand.logo ? (
              <Image
                src={resolveAssetUrl(brand.logo) || "/placeholder.svg"}
                alt={`${brand.name} Logo`}
                width={150}
                height={75}
                className="object-contain transition-transform duration-300 group-hover:scale-105"
                crossOrigin="anonymous"
              />
            ) : (
              <span className="text-gray-500">No Logo</span>
            )}
          </div>
          <div className="p-4 border-t border-gray-200">
            <h3 className="font-semibold text-gray-800 truncate group-hover:text-blue-600">{brand.name}</h3>
          </div>
        </Link>
      ))}
    </div>
  )
}
