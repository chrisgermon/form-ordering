import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"

export async function POST(request: Request) {
  const supabase = createAdminClient()
  try {
    const { section_id, name, price } = await request.json()

    if (!section_id || !name) {
      return NextResponse.json({ error: "Section ID and name are required" }, { status: 400 })
    }

    const { data: maxSortOrderData, error: maxSortOrderError } = await supabase
      .from("product_items")
      .select("sort_order")
      .eq("section_id", section_id)
      .order("sort_order", { ascending: false })
      .limit(1)
      .single()

    if (maxSortOrderError && maxSortOrderError.code !== "PGRST116") {
      throw maxSortOrderError
    }

    const newSortOrder = maxSortOrderData ? maxSortOrderData.sort_order + 1 : 0

    const { data, error } = await supabase
      .from("product_items")
      .insert([{ section_id, name, price, sort_order: newSortOrder }])
      .select()
      .single()

    if (error) {
      throw error
    }

    const { data: section } = await supabase.from("product_sections").select("brand_id").eq("id", section_id).single()
    if (section) {
      const { data: brand } = await supabase.from("brands").select("slug").eq("id", section.brand_id).single()
      if (brand) {
        revalidatePath(`/admin/editor/${brand.slug}`)
        revalidatePath(`/forms/${brand.slug}`)
      }
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error("Error creating item:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  const supabase = createAdminClient()
  try {
    const { id, name, price } = await request.json()

    if (!id) {
      return NextResponse.json({ error: "Item ID is required" }, { status: 400 })
    }

    const { data, error } = await supabase.from("product_items").update({ name, price }).eq("id", id).select().single()

    if (error) {
      throw error
    }

    const { data: section } = await supabase
      .from("product_sections")
      .select("brand_id")
      .eq("id", data.section_id)
      .single()
    if (section) {
      const { data: brand } = await supabase.from("brands").select("slug").eq("id", section.brand_id).single()
      if (brand) {
        revalidatePath(`/admin/editor/${brand.slug}`)
        revalidatePath(`/forms/${brand.slug}`)
      }
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error("Error updating item:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
