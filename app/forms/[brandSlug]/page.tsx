import { createClient } from "@/utils/supabase/server"
import { notFound } from "next/navigation"
import Image from "next/image"
import { BrandForm } from "./form"
import type { BrandData, Item, Section, Brand } from "@/lib/types"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Terminal } from "lucide-react"

export const revalidate = 0

type BrandFetchResult =
  | { status: "found"; data: BrandData }
  | { status: "inactive"; data: { name: string } }
  | { status: "not_found" }

async function getBrandData(slug: string): Promise<BrandFetchResult> {
  const supabase = createClient()

  // Step 1: Fetch brand by slug, regardless of active status
  const { data: brand, error: brandError } = await supabase
    .from("brands")
    .select("id, name, slug, logo, emails, active")
    .eq("slug", slug)
    .single<Brand>()

  if (brandError || !brand) {
    // Log the error but return a clear status. This could be a legitimate 404.
    if (brandError) {
      console.error(`Error fetching brand with slug ${slug}:`, brandError.message)
    }
    return { status: "not_found" }
  }

  // Step 2: Check if the brand is inactive
  if (!brand.active) {
    return { status: "inactive", data: { name: brand.name } }
  }

  // Step 3: If active, fetch all related data in parallel.
  const [locationsResult, sectionsResult] = await Promise.all([
    supabase.from("clinic_locations").select("*").eq("brand_id", brand.id),
    supabase.from("sections").select("*").eq("brand_id", brand.id).order("position"),
  ])

  const { data: clinicLocations, error: locationsError } = locationsResult
  const { data: sections, error: sectionsError } = sectionsResult

  if (locationsError || sectionsError) {
    console.error(`Error fetching related data for brand ${slug}:`, { locationsError, sectionsError })
    // If we can't get sections, the form is unusable. Treat as not found.
    return { status: "not_found" }
  }

  // Step 4: For each section, fetch its items and their options.
  const sectionsWithItems = await Promise.all(
    (sections || []).map(async (section: Section) => {
      const { data: items, error: itemsError } = await supabase
        .from("items")
        .select("*")
        .eq("section_id", section.id)
        .order("position")

      if (itemsError) console.error(`Error fetching items for section ${section.id}:`, itemsError)

      const itemsWithOptions = await Promise.all(
        (items || []).map(async (item: Item) => {
          const { data: options, error: optionsError } = await supabase
            .from("options")
            .select("*")
            .eq("item_id", item.id)
            .order("sort_order")

          if (optionsError) console.error(`Error fetching options for item ${item.id}:`, optionsError)

          return { ...item, options: options || [] }
        }),
      )
      return { ...section, items: itemsWithOptions }
    }),
  )

  // Step 5: Assemble and return the final object.
  const fullBrandData: BrandData = {
    ...brand,
    clinic_locations: clinicLocations || [],
    sections: sectionsWithItems,
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
        <BrandForm brand={brand} />
      </main>
      <footer className="py-4 text-center text-sm text-gray-500">
        <p>
          &copy; {new Date().getFullYear()} {brand.name}. All rights reserved.
        </p>
      </footer>
    </div>
  )
}
