import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"

export async function POST(request: Request) {
  const supabase = createAdminClient()
  try {
    const { brand_id, title } = await request.json()

    if (!brand_id || !title) {
      return NextResponse.json({ error: "Brand ID and title are required" }, { status: 400 })
    }

    const { data: maxSortOrderData, error: maxSortOrderError } = await supabase
      .from("product_sections")
      .select("sort_order")
      .eq("brand_id", brand_id)
      .order("sort_order", { ascending: false })
      .limit(1)
      .single()

    if (maxSortOrderError && maxSortOrderError.code !== "PGRST116") {
      throw maxSortOrderError
    }

    const newSortOrder = maxSortOrderData ? maxSortOrderData.sort_order + 1 : 0

    const { data, error } = await supabase
      .from("product_sections")
      .insert([{ brand_id, title, sort_order: newSortOrder }])
      .select()
      .single()

    if (error) {
      throw error
    }

    const { data: brand } = await supabase.from("brands").select("slug").eq("id", brand_id).single()
    if (brand) {
      revalidatePath(`/admin/editor/${brand.slug}`)
      revalidatePath(`/forms/${brand.slug}`)
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error("Error creating section:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  const supabase = createAdminClient()
  try {
    const { id, title } = await request.json()

    if (!id || !title) {
      return NextResponse.json({ error: "Section ID and title are required" }, { status: 400 })
    }

    const { data, error } = await supabase.from("product_sections").update({ title }).eq("id", id).select().single()

    if (error) {
      throw error
    }

    const { data: brand } = await supabase.from("brands").select("slug").eq("id", data.brand_id).single()
    if (brand) {
      revalidatePath(`/admin/editor/${brand.slug}`)
      revalidatePath(`/forms/${brand.slug}`)
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error("Error updating section:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
