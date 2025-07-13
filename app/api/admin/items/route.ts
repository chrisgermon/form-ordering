import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"

async function revalidateEditorPaths(brandSlug: string) {
  revalidatePath(`/admin/editor/${brandSlug}`)
  revalidatePath(`/forms/${brandSlug}`)
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const body = await request.json()

    const { data: brandData } = await supabase.from("brands").select("slug").eq("id", body.brandId).single()

    const { data: maxPosData, error: maxPosError } = await supabase
      .from("items")
      .select("position")
      .eq("section_id", body.sectionId)
      .order("position", { ascending: false })
      .limit(1)
      .single()

    if (maxPosError && maxPosError.code !== "PGRST116") {
      throw maxPosError
    }

    const newPosition = (maxPosData?.position ?? -1) + 1

    const { data: item, error } = await supabase
      .from("items")
      .insert({
        code: body.code,
        name: body.name,
        description: body.description,
        sample_link: body.sample_link,
        section_id: body.sectionId,
        brand_id: body.brandId,
        position: newPosition,
        field_type: body.fieldType,
        placeholder: body.placeholder,
        is_required: body.is_required,
      })
      .select()
      .single()

    if (error) throw error

    if (brandData?.slug) {
      revalidateEditorPaths(brandData.slug)
    }

    return NextResponse.json(item)
  } catch (error: any) {
    console.error("Error creating item:", error)
    return NextResponse.json({ error: `Failed to create item: ${error.message}` }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const body = await request.json()

    const { data: itemData } = await supabase.from("items").select("brands(slug)").eq("id", body.id).single()

    const { data: item, error } = await supabase
      .from("items")
      .update({
        code: body.code,
        name: body.name,
        description: body.description,
        sample_link: body.sample_link,
        field_type: body.fieldType,
        placeholder: body.placeholder,
        is_required: body.is_required,
      })
      .eq("id", body.id)
      .select()
      .single()

    if (error) throw error

    if (itemData?.brands?.slug) {
      revalidateEditorPaths(itemData.brands.slug)
    }

    return NextResponse.json(item)
  } catch (error: any) {
    console.error("Error updating item:", error)
    return NextResponse.json({ error: `Failed to update item: ${error.message}` }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Item ID is required" }, { status: 400 })
    }

    const { data: itemData } = await supabase.from("items").select("brands(slug)").eq("id", id).single()

    const { error } = await supabase.from("items").delete().eq("id", id)

    if (error) throw error

    if (itemData?.brands?.slug) {
      revalidateEditorPaths(itemData.brands.slug)
    }

    return NextResponse.json({ success: true, message: "Item deleted successfully." })
  } catch (error: any) {
    console.error("Error deleting item:", error)
    return NextResponse.json({ error: `Failed to delete item: ${error.message}` }, { status: 500 })
  }
}
