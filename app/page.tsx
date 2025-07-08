import Link from "next/link"
import { createAdminClient } from "@/lib/supabase/admin"
import { BrandGrid } from "@/components/brand-grid"
import type { BrandType, ClinicLocation } from "@/lib/types"

export const revalidate = 0 // Revalidate data on every request

// Helper to check if clinic data is in an old format (e.g., array of strings)
const isLegacyClinicData = (locations: any): locations is string[] => {
  if (!Array.isArray(locations) || locations.length === 0) {
    return false
  }
  // Check if the first element is a string, which indicates the old format.
  return typeof locations[0] === "string"
}

async function getBrands(): Promise<BrandType[]> {
  const supabase = createAdminClient()

  const { data: brands, error } = await supabase
    .from("brands")
    .select("id, name, slug, logo, emails, clinic_locations, active")
    .eq("active", true)
    .order("name")

  if (error) {
    console.error("Error fetching brands:", error)
    return []
  }

  if (!brands) {
    return []
  }

  // Post-process the data to handle legacy formats and ensure type safety.
  const processedBrands = brands.map((brand) => {
    let processedLocations: ClinicLocation[] = []
    if (isLegacyClinicData(brand.clinic_locations)) {
      // If it's an array of strings, convert it to the new object format.
      processedLocations = (brand.clinic_locations as string[]).map((name: string) => ({
        name,
        address: "",
        phone: "",
        email: "",
      }))
    } else {
      // It's already in the correct format or it's an empty array.
      processedLocations = brand.clinic_locations || []
    }

    return {
      ...brand,
      clinic_locations: processedLocations,
      emails: brand.emails || [], // Ensure emails is always an array.
    }
  })

  return processedBrands as BrandType[]
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
          <BrandGrid brands={brands.slice(0, 6)} />
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
            <div className="text-center flex items-center gap-6">
              <Link href="/admin/instructions" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
                Admin Instructions
              </Link>
              <Link href="/admin/dashboard" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
                Admin Portal
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
