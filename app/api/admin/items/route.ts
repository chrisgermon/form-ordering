import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"
import type { Item } from "@/lib/types"

async function revalidateEditorPaths(supabase: ReturnType<typeof createAdminClient>, brandId: string) {
  const { data: brand, error } = await supabase.from("brands").select("slug").eq("id", brandId).single()
  if (error) {
    console.error(`Could not find brand with id ${brandId} for revalidation:`, error)
    return
  }
  if (brand?.slug) {
    revalidatePath(`/admin/editor/${brand.slug}`)
    revalidatePath(`/forms/${brand.slug}`)
  }
}

export async function POST(request: NextRequest) {
  const supabase = createAdminClient()
  try {
    const body = (await request.json()) as Item

    const { options, ...itemCore } = body

    const { data: maxPosData, error: maxPosError } = await supabase
      .from("items")
      .select("position")
      .eq("section_id", itemCore.section_id)
      .order("position", { ascending: false })
      .limit(1)
      .single()

    if (maxPosError && maxPosError.code !== "PGRST116") throw maxPosError
    const newPosition = (maxPosData?.position ?? -1) + 1

    const { data: newItem, error: itemError } = await supabase
      .from("items")
      .insert({
        ...itemCore,
        position: newPosition,
      })
      .select()
      .single()

    if (itemError) throw itemError

    if (options && options.length > 0) {
      const optionsToInsert = options.map((opt, index) => ({
        item_id: newItem.id,
        value: opt.value,
        label: opt.label || opt.value,
        sort_order: index,
      }))
      const { error: optionsError } = await supabase.from("options").insert(optionsToInsert)
      if (optionsError) throw optionsError
    }

    const { data: finalItem, error: finalError } = await supabase
      .from("items")
      .select("*, options(*)")
      .eq("id", newItem.id)
      .single()

    if (finalError) throw finalError

    await revalidateEditorPaths(supabase, itemCore.brand_id)

    return NextResponse.json(finalItem)
  } catch (error: any) {
    console.error("Error creating item:", error)
    return NextResponse.json({ error: `Failed to create item: ${error.message}` }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const supabase = createAdminClient()
  try {
    const body = (await request.json()) as Item
    const { id, options, ...itemUpdates } = body

    if (!id) {
      return NextResponse.json({ error: "Item ID is required for update." }, { status: 400 })
    }

    const { data: item, error: itemError } = await supabase
      .from("items")
      .update(itemUpdates)
      .eq("id", id)
      .select()
      .single()

    if (itemError) throw itemError

    // Simple strategy: delete all old options and insert new ones
    const { error: deleteError } = await supabase.from("options").delete().eq("item_id", id)
    if (deleteError) throw deleteError

    if (options && options.length > 0) {
      const optionsToInsert = options.map((opt, index) => ({
        item_id: id,
        value: opt.value,
        label: opt.label || opt.value,
        sort_order: index,
      }))
      const { error: optionsError } = await supabase.from("options").insert(optionsToInsert)
      if (optionsError) throw optionsError
    }

    const { data: finalItem, error: finalError } = await supabase
      .from("items")
      .select("*, options(*)")
      .eq("id", item.id)
      .single()

    if (finalError) throw finalError

    await revalidateEditorPaths(supabase, item.brand_id)

    return NextResponse.json(finalItem)
  } catch (error: any) {
    console.error("Error updating item:", error)
    return NextResponse.json({ error: `Failed to update item: ${error.message}` }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const supabase = createAdminClient()
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Item ID is required" }, { status: 400 })
    }

    const { data: itemData, error: fetchError } = await supabase.from("items").select("brand_id").eq("id", id).single()

    if (fetchError) throw fetchError

    const { error } = await supabase.from("items").delete().eq("id", id)

    if (error) throw error

    await revalidateEditorPaths(supabase, itemData.brand_id)

    return NextResponse.json({ success: true, message: "Item deleted successfully." })
  } catch (error: any) {
    console.error("Error deleting item:", error)
    return NextResponse.json({ error: `Failed to delete item: ${error.message}` }, { status: 500 })
  }
}
