import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = createClient()
    const { data: items, error } = await supabase.from("product_items").select("*").order("sort_order")
    if (error) throw error
    return NextResponse.json(items)
  } catch (error) {
    console.error("Error fetching items:", error)
    return NextResponse.json({ error: "Failed to fetch items" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const body = await request.json()
    const { data: maxSortOrderData, error: maxSortError } = await supabase
      .from("product_items")
      .select("sort_order")
      .eq("section_id", body.sectionId)
      .order("sort_order", { ascending: false })
      .limit(1)
      .single()
    if (maxSortError && maxSortError.code !== "PGRST116") {
      throw maxSortError
    }
    const newSortOrder = (maxSortOrderData?.sort_order ?? -1) + 1
    const { data: item, error } = await supabase
      .from("product_items")
      .insert({
        code: body.code,
        name: body.name,
        description: body.description,
        quantities: body.quantities,
        sample_link: body.sampleLink,
        section_id: body.sectionId,
        brand_id: body.brandId,
        sort_order: newSortOrder,
      })
      .select()
      .single()
    if (error) throw error
    return NextResponse.json(item)
  } catch (error) {
    console.error("Error creating item:", error)
    return NextResponse.json({ error: "Failed to create item" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient()
    const body = await request.json()
    const { data: item, error } = await supabase
      .from("product_items")
      .update({
        code: body.code,
        name: body.name,
        description: body.description,
        quantities: body.quantities,
        sample_link: body.sampleLink,
        section_id: body.sectionId,
        brand_id: body.brandId,
      })
      .eq("id", body.id)
      .select()
      .single()
    if (error) throw error
    return NextResponse.json(item)
  } catch (error) {
    console.error("Error updating item:", error)
    return NextResponse.json({ error: "Failed to update item" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) {
      return NextResponse.json({ error: "Item ID is required" }, { status: 400 })
    }
    const { error } = await supabase.from("product_items").delete().eq("id", id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting item:", error)
    return NextResponse.json({ error: "Failed to delete item" }, { status: 500 })
  }
}
