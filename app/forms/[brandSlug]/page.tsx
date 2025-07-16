import { createClient } from "@/utils/supabase/server"
import { notFound } from "next/navigation"
import Image from "next/image"
import { OrderForm } from "./order-form"
import type { BrandData, Section, Brand, ClinicLocation, LocationOption } from "@/lib/types"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Terminal } from "lucide-react"

export const revalidate = 0

type BrandFetchResult =
  | { status: "found"; data: BrandData }
  | { status: "inactive"; data: { name: string } }
  | { status: "not_found" }

async function getBrandData(slug: string): Promise<BrandFetchResult> {
  const supabase = createClient()

  const { data: brand, error: brandError } = await supabase
    .from("brands")
    .select("id, name, slug, logo, emails, active")
    .eq("slug", slug)
    .single<Brand>()

  if (brandError || !brand) {
    if (brandError) console.error(`Error fetching brand with slug ${slug}:`, brandError.message)
    return { status: "not_found" }
  }

  if (!brand.active) {
    return { status: "inactive", data: { name: brand.name } }
  }

  const [locationsResult, sectionsResult] = await Promise.all([
    supabase.from("clinic_locations").select("*").eq("brand_id", brand.id),
    supabase.from("sections").select("*, items(*, options(*))").eq("brand_id", brand.id).order("position"),
  ])

  const { data: clinicLocations, error: locationsError } = locationsResult
  const { data: sections, error: sectionsError } = sectionsResult

  if (locationsError || sectionsError) {
    console.error(`Error fetching related data for brand ${slug}:`, { locationsError, sectionsError })
    return { status: "not_found" }
  }

  const fullBrandData: BrandData = {
    ...brand,
    clinic_locations: (clinicLocations || []) as ClinicLocation[],
    sections: (sections || []).map((s) => ({
      ...s,
      items: s.items.map((i) => ({ ...i, options: i.options || [] })),
    })) as Section[],
  }

  return { status: "found", data: fullBrandData }
}

export default async function BrandFormPage({ params }: { params: { brandSlug: string } }) {
  const result = await getBrandData(params.brandSlug)

  if (result.status === "not_found") {
    notFound()
  }

  if (result.status === "inactive") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-lg">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Form Currently Unavailable</AlertTitle>
          <AlertDescription>
            The order form for "{result.data.name}" is not currently active. Please contact the administrator for
            assistance.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const brand = result.data

  // Create a simplified, safe array for the form's dropdowns
  const locationOptions: LocationOption[] = (brand.clinic_locations || [])
    .filter((loc) => loc && loc.id && loc.name)
    .map((loc) => ({
      value: loc.id,
      label: loc.name,
    }))

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {brand.logo ? (
              <Image
                src={brand.logo || "/placeholder.svg"}
                alt={`${brand.name} Logo`}
                width={160}
                height={40}
                className="object-contain h-10 w-auto"
                priority
              />
            ) : (
              <div className="h-10" />
            )}
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-800 text-center">{brand.name} Order Form</h1>
          <div className="w-[160px]" /> {/* Spacer */}
        </div>
      </header>
      <main className="container mx-auto p-4 md:p-8">
        <OrderForm brandSlug={brand.slug} locationOptions={locationOptions} sections={brand.sections} />
      </main>
      <footer className="py-4 text-center text-sm text-gray-500">
        <p>
          &copy; {new Date().getFullYear()} {brand.name}. All rights reserved.
        </p>
      </footer>
    </div>
  )
}
