import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"

export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: brand, error } = await supabase
      .from("brands")
      .select(
        `
        id, name, slug, logo, emails, active,
        product_sections (
          id, title, sort_order, brand_id,
          product_items (
            id, code, name, description, quantities, sample_link, sort_order, section_id, brand_id
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
