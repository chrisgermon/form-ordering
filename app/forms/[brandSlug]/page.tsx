import { createClient } from "@/utils/supabase/server"
import { notFound } from "next/navigation"
import Image from "next/image"
import { BrandForm } from "./form"
import type { BrandData, Item, Section } from "@/lib/types"

export const revalidate = 0

async function getBrandData(slug: string): Promise<BrandData | null> {
  const supabase = createClient()

  // Step 1: Fetch the core brand data.
  const { data: brand, error: brandError } = await supabase
    .from("brands")
    .select("id, name, slug, logo_url, emails, active")
    .eq("slug", slug)
    .eq("active", true)
    .single()

  if (brandError || !brand) {
    console.error(`Error fetching active brand with slug ${slug}:`, brandError?.message)
    return null
  }

  // Step 2: Fetch all related data in parallel.
  const [locationsResult, sectionsResult] = await Promise.all([
    supabase.from("clinic_locations").select("*").eq("brand_id", brand.id),
    supabase.from("sections").select("*").eq("brand_id", brand.id).order("position"),
  ])

  const { data: clinicLocations, error: locationsError } = locationsResult
  const { data: sections, error: sectionsError } = sectionsResult

  if (locationsError) console.error(`Error fetching clinic locations for brand ${slug}:`, locationsError)
  if (sectionsError) console.error(`Error fetching sections for brand ${slug}:`, sectionsError)

  // Step 3: For each section, fetch its items and their options.
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

  // Step 4: Assemble and return the final object.
  const fullBrandData: BrandData = {
    ...brand,
    clinic_locations: clinicLocations || [],
    sections: sectionsWithItems,
  }

  return fullBrandData
}

export default async function BrandFormPage({ params }: { params: { brandSlug: string } }) {
  const brand = await getBrandData(params.brandSlug)

  if (!brand) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {brand.logo_url ? (
              <Image
                src={brand.logo_url || "/placeholder.svg"}
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
