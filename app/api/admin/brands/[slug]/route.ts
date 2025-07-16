import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/utils/supabase/server"

export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const supabase = createAdminClient()

    // Step 1: Fetch the core brand data.
    const { data: brand, error: brandError } = await supabase
      .from("brands")
      .select(
        `
        id, name, slug, logo_url, emails, active,
        sections (
          *,
          items (
            *,
            options (*)
          )
        )
      `,
      )
      .eq("slug", params.slug)
      .single()

    if (brandError) throw brandError
    if (!brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 })
    }

    // Step 2: Fetch the clinic locations separately.
    const { data: clinicLocations, error: locationsError } = await supabase
      .from("clinic_locations")
      .select("*")
      .eq("brand_id", brand.id)

    if (locationsError) {
      // Log the error but proceed. The client can decide how to handle missing locations.
      console.error(`Error fetching clinic locations for brand ${params.slug}:`, locationsError)
    }

    // Step 3: Combine the data and return the full object.
    const fullBrandData = {
      ...brand,
      clinic_locations: clinicLocations || [],
    }

    return NextResponse.json(fullBrandData)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : `Failed to fetch brand ${params.slug}`
    console.error(`Error in GET brand API route for ${params.slug}:`, errorMessage)
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
