import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/utils/supabase/server"
import type { Item, Section } from "@/lib/types"

export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const supabase = createAdminClient()

    // Step 1: Fetch the core brand data.
    const { data: brand, error: brandError } = await supabase
      .from("brands")
      .select("id, name, slug, logo_url, emails, active")
      .eq("slug", params.slug)
      .single()

    if (brandError) throw brandError
    if (!brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 })
    }

    // Step 2: Fetch all related data in parallel.
    const [locationsResult, sectionsResult] = await Promise.all([
      supabase.from("clinic_locations").select("*").eq("brand_id", brand.id),
      supabase.from("sections").select("*").eq("brand_id", brand.id).order("position"),
    ])

    const { data: clinicLocations, error: locationsError } = locationsResult
    const { data: sections, error: sectionsError } = sectionsResult

    if (locationsError) console.error(`Error fetching clinic locations for brand ${params.slug}:`, locationsError)
    if (sectionsError) console.error(`Error fetching sections for brand ${params.slug}:`, sectionsError)

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
    const fullBrandData = {
      ...brand,
      clinic_locations: clinicLocations || [],
      sections: sectionsWithItems,
    }

    return NextResponse.json(fullBrandData)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : `Failed to fetch brand ${params.slug}`
    console.error(`Error in GET brand API route for ${params.slug}:`, errorMessage)
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
