import Link from "next/link"
import { createServerSupabaseClient } from "@/lib/supabase"
import { BrandGrid } from "@/components/brand-grid"

// Define the type for a brand on the homepage, matching what BrandGrid expects.
interface Brand {
  id: string
  name: string
  slug: string
  logo: string | null
}

export const revalidate = 0 // Revalidate data on every request

async function getBrands(): Promise<Brand[]> {
  const supabase = createServerSupabaseClient()

  // This query now correctly fetches all required columns, including 'logo'.
  // This will work once the database schema is updated with the provided SQL script.
  const { data: brands, error } = await supabase
    .from("brands")
    .select("id, name, slug, logo")
    .eq("active", true)
    .order("name")

  if (error) {
    console.error("Error fetching brands:", error)
    // This error will occur if the database schema is not up-to-date.
    // Please run the `000-initial-schema.sql` script.
    return []
  }

  return brands || []
}

export default async function HomePage() {
  const brands = await getBrands()

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <main className="flex-grow">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">Printed Form Ordering</h1>
            <p className="mt-4 text-lg leading-8 text-gray-600">
              Select your brand to access the customised printing order form for your radiology practice.
            </p>
          </div>
          <BrandGrid brands={brands} />
        </div>
      </main>

      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-gray-600 text-sm">Platform Created by</span>
              <a
                href="https://crowdit.com.au"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                <img
                  src="https://rkzg1azdhvqaqoqa.public.blob.vercel-storage.com/admin-uploads/1751267287132-CrowdIT-Logo%401x.png"
                  alt="Crowd IT Logo"
                  className="h-8 w-auto object-contain"
                  crossOrigin="anonymous"
                />
              </a>
            </div>
            <div className="text-center">
              <Link href="/admin" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
                Admin Portal
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
