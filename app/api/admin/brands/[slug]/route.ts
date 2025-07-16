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
    console.error(`Error fetching brand ${params.slug}:`, error)
    return NextResponse.json({ error: `Failed to fetch brand ${params.slug}` }, { status: 500 })
  }
}
