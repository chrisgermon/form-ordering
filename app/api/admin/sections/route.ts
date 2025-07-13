import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"

// Helper function to revalidate paths associated with a brand
async function revalidateBrandPaths(supabase: ReturnType<typeof createAdminClient>, brandId: string) {
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

export async function GET() {
  try {
    const supabase = createAdminClient()

    const { data: sections, error } = await supabase
      .from("product_sections")
      .select(
        `
        *,
        product_items (*)
      `,
      )
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
    const supabase = createAdminClient()
    const body = await request.json()
    const { title, brandId } = body

    if (!title || !brandId) {
      return NextResponse.json({ error: "Title and brandId are required" }, { status: 400 })
    }

    const { data: maxSortOrderData, error: maxSortError } = await supabase
      .from("product_sections")
      .select("sort_order")
      .eq("brand_id", brandId)
      .order("sort_order", { ascending: false })
      .limit(1)
      .single()

    if (maxSortError && maxSortError.code !== "PGRST116") {
      // Ignore 'No rows found' error, which is expected for the first section
      throw maxSortError
    }

    const newSortOrder = (maxSortOrderData?.sort_order ?? -1) + 1

    const { data: section, error } = await supabase
      .from("product_sections")
      .insert({
        title: title,
        brand_id: brandId,
        sort_order: newSortOrder,
      })
      .select()
      .single()

    if (error) throw error

    // Revalidate paths to ensure the UI updates
    await revalidateBrandPaths(supabase, brandId)

    return NextResponse.json(section)
  } catch (error) {
    console.error("Error creating section:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to create section"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const body = await request.json()
    const { id, title, brandId } = body

    if (!id || !title || !brandId) {
      return NextResponse.json({ error: "ID, title, and brandId are required" }, { status: 400 })
    }

    const { data: section, error } = await supabase
      .from("product_sections")
      .update({
        title: title,
        brand_id: brandId,
      })
      .eq("id", id)
      .select()
      .single()

    if (error) throw error

    // Revalidate paths to ensure the UI updates
    await revalidateBrandPaths(supabase, brandId)

    return NextResponse.json(section)
  } catch (error) {
    console.error("Error updating section:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to update section"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Section ID is required" }, { status: 400 })
    }

    // First, get the brand ID for revalidation before deleting
    const { data: sectionData, error: fetchError } = await supabase
      .from("product_sections")
      .select("brand_id")
      .eq("id", id)
      .single()

    if (fetchError) {
      // It's okay if it's not found, but other errors should be thrown
      if (fetchError.code !== "PGRST116") throw fetchError
    }

    // Now, delete the section
    const { error: deleteError } = await supabase.from("product_sections").delete().eq("id", id)

    if (deleteError) throw deleteError

    // Revalidate paths to ensure the UI updates
    if (sectionData?.brand_id) {
      await revalidateBrandPaths(supabase, sectionData.brand_id)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting section:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to delete section"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
