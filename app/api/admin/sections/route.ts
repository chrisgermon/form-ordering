import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"

export async function GET() {
  try {
    const supabase = createServerSupabaseClient()

    const { data: sections, error } = await supabase
      .from("product_sections")
      .select(`
        *,
        product_items (*)
      `)
      .order("sort_order")

    if (error) throw error

    return NextResponse.json(sections)
  } catch (error) {
    console.error("Error fetching sections:", error)
    return NextResponse.json({ error: "Failed to fetch sections" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const body = await request.json()

    const { data: maxSortOrderData, error: maxSortError } = await supabase
      .from("product_sections")
      .select("sort_order")
      .eq("brand_id", body.brandId)
      .order("sort_order", { ascending: false })
      .limit(1)
      .single()

    if (maxSortError && maxSortError.code !== "PGRST116") {
      // Ignore 'No rows found' error
      throw maxSortError
    }

    const newSortOrder = (maxSortOrderData?.sort_order ?? -1) + 1

    const { data: section, error } = await supabase
      .from("product_sections")
      .insert({
        title: body.title,
        brand_id: body.brandId,
        sort_order: newSortOrder,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(section)
  } catch (error) {
    console.error("Error creating section:", error)
    return NextResponse.json({ error: "Failed to create section" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const body = await request.json()

    const { data: section, error } = await supabase
      .from("product_sections")
      .update({
        title: body.title,
        brand_id: body.brandId,
      })
      .eq("id", body.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(section)
  } catch (error) {
    console.error("Error updating section:", error)
    return NextResponse.json({ error: "Failed to update section" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Section ID is required" }, { status: 400 })
    }

    const { error } = await supabase.from("product_sections").delete().eq("id", id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting section:", error)
    return NextResponse.json({ error: "Failed to delete section" }, { status: 500 })
  }
}
