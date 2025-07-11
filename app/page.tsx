import { createAdminClient } from "@/utils/supabase/server"
import Link from "next/link"
import Image from "next/image"
import { resolveAssetUrl } from "@/lib/utils"

export default async function HomePage() {
  const supabase = createAdminClient()
  const { data: brands, error } = await supabase
    .from("brands")
    .select("id, name, slug, logo")
    .eq("active", true)
    .order("name")

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-500">Error loading brands: {error.message}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 sm:p-8">
      <div className="text-center mb-12">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">Select Your Brand</h1>
        <p className="text-md sm:text-lg text-gray-600 mt-2">Choose your clinic to access the order form.</p>
      </div>
      {brands && brands.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-6xl w-full">
          {brands.map((brand) => (
            <Link
              href={`/forms/${brand.slug}`}
              key={brand.id}
              className="group block bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden"
            >
              <div className="w-full h-48 bg-gray-100 flex items-center justify-center p-4">
                <Image
                  src={resolveAssetUrl(brand.logo) || `/placeholder.svg?width=150&height=150&query=${brand.name}+logo`}
                  alt={`${brand.name} Logo`}
                  width={150}
                  height={150}
                  className="object-contain h-full w-full"
                />
              </div>
              <div className="p-4 border-t border-gray-200">
                <h2 className="text-lg font-semibold text-gray-700 group-hover:text-blue-600 transition-colors duration-300 truncate">
                  {brand.name}
                </h2>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center">
          <p className="text-gray-500">No active brands found.</p>
          <p className="text-sm text-gray-400 mt-2">Please check the admin dashboard to add or activate brands.</p>
        </div>
      )}
    </div>
  )
}
