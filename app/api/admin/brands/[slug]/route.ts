import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/utils/supabase/server"

export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const supabase = createAdminClient()
    const { data: brand, error } = await supabase
      .from("brands")
      .select(
        `
      id, name, slug, logo_url, emails, active,
      clinic_locations(*),
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

    if (error) throw error

    return NextResponse.json(brand)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : `Failed to fetch brand ${params.slug}`
    console.error(`Error fetching brand ${params.slug}:`, errorMessage)
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
