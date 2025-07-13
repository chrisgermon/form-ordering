"use server"

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"
import type { Brand, Item, Option, Section } from "@/lib/types"

export async function getBrandForEditor(slug: string): Promise<{ brand: Brand | null; error: string | null }> {
  const supabase = createClient()

  try {
    // 1. Fetch the brand
    const { data: brandData, error: brandError } = await supabase.from("brands").select("*").eq("slug", slug).single()

    if (brandError || !brandData) {
      console.error(`Database error fetching brand data for slug '${slug}':`, brandError?.message)
      if (brandError?.code === "PGRST116") {
        // This code means no rows were found
        return { brand: null, error: `Could not find a brand with slug "${slug}". Please check the URL.` }
      }
      return {
        brand: null,
        error:
          "Database schema error: A relationship between tables is missing. Please run the latest database script to fix.",
      }
    }

    const brand: Brand = brandData

    // 2. Fetch sections for the brand
    const { data: sectionsData, error: sectionsError } = await supabase
      .from("sections")
      .select("*")
      .eq("brand_id", brand.id)
      .order("order", { ascending: true })

    if (sectionsError) {
      console.error(`Database error fetching sections for brand '${brand.id}':`, sectionsError.message)
      return { brand: null, error: "Could not fetch form sections." }
    }

    const sections: Section[] = sectionsData || []
    const sectionIds = sections.map((s) => s.id)

    if (sectionIds.length > 0) {
      // 3. Fetch all items for all sections
      const { data: itemsData, error: itemsError } = await supabase
        .from("items")
        .select("*")
        .in("section_id", sectionIds)
        .order("order", { ascending: true })

      if (itemsError) {
        console.error(`Database error fetching items for sections '${sectionIds.join(",")}':`, itemsError.message)
        return { brand: null, error: "Could not fetch form items." }
      }

      const items: Item[] = itemsData || []
      const itemIds = items.map((i) => i.id)

      if (itemIds.length > 0) {
        // 4. Fetch all options for all items
        const { data: optionsData, error: optionsError } = await supabase
          .from("options")
          .select("*")
          .in("item_id", itemIds)
          .order("order", { ascending: true })

        if (optionsError) {
          console.error(`Database error fetching options for items '${itemIds.join(",")}':`, optionsError.message)
          return { brand: null, error: "Could not fetch item options." }
        }

        const options: Option[] = optionsData || []

        // 5. Assemble the data structure
        // Add options to their respective items
        items.forEach((item) => {
          item.options = options.filter((opt) => opt.item_id === item.id)
        })
      } else {
        items.forEach((item) => (item.options = []))
      }

      // Add items to their respective sections
      sections.forEach((section) => {
        section.items = items.filter((item) => item.section_id === section.id)
      })
    }

    brand.sections = sections
    return { brand, error: null }
  } catch (e: any) {
    console.error("Unexpected error in getBrandForEditor:", e.message)
    return { brand: null, error: "An unexpected server error occurred." }
  }
}

export async function updateSectionOrder(brandId: number, sections: { id: number; order: number }[]) {
  const supabase = createClient()
  const updates = sections.map(({ id, order }) => supabase.from("sections").update({ order }).eq("id", id))

  const results = await Promise.all(updates)
  const error = results.find((res) => res.error)

  if (error) {
    return { success: false, message: "Failed to update section order." }
  }

  revalidatePath(`/admin/editor/${brandId}`, "page")
  return { success: true }
}

export async function updateItemOrder(sectionId: number, items: { id: number; order: number }[]) {
  const supabase = createClient()
  const updates = items.map(({ id, order }) => supabase.from("items").update({ order }).eq("id", id))

  const results = await Promise.all(updates)
  const error = results.find((res) => res.error)

  if (error) {
    return { success: false, message: "Failed to update item order." }
  }

  revalidatePath(`/admin/editor/section/${sectionId}`, "page")
  return { success: true }
}

export async function addSection(brandId: number, title: string) {
  const supabase = createClient()

  const { data: maxOrderData, error: maxOrderError } = await supabase
    .from("sections")
    .select("order")
    .eq("brand_id", brandId)
    .order("order", { ascending: false })
    .limit(1)
    .single()

  if (maxOrderError && maxOrderError.code !== "PGRST116") {
    return { success: false, message: "Could not determine section order." }
  }

  const newOrder = (maxOrderData?.order ?? -1) + 1

  const { error } = await supabase.from("sections").insert({
    brand_id: brandId,
    title,
    order: newOrder,
  })

  if (error) {
    return { success: false, message: "Failed to add new section." }
  }

  revalidatePath(`/admin/editor/${brandId}`, "page")
  return { success: true, message: `Section "${title}" added.` }
}

export async function clearForm(brandId: number) {
  const supabase = createClient()
  const { error } = await supabase.from("sections").delete().eq("brand_id", brandId)

  if (error) {
    return { success: false, message: "Failed to clear the form." }
  }

  revalidatePath(`/admin/editor/${brandId}`, "page")
  return { success: true, message: "Form has been cleared." }
}
