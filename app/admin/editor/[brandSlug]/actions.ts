"use server"

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"
import type { Brand, Item, Option, Section } from "@/lib/types"

export async function getBrandForEditor(slug: string): Promise<{ brand: Brand | null; error: string | null }> {
  const supabase = createClient()
  try {
    // 1. Fetch the brand
    const { data: brandData, error: brandError } = await supabase.from("brands").select("*").eq("slug", slug).single()

    if (brandError) {
      console.error(`Database error fetching brand data for slug '${slug}':`, brandError.message)
      if (brandError.code === "PGRST116") {
        return { brand: null, error: `Could not find a brand with slug "${slug}". Please check the URL.` }
      }
      return { brand: null, error: "A database error occurred while fetching the brand." }
    }

    const brand: Brand = brandData

    // 2. Fetch sections for the brand
    const { data: sectionsData, error: sectionsError } = await supabase
      .from("sections")
      .select("*")
      .eq("brand_id", brand.id)
      .order("position", { ascending: true })

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
        .order("position", { ascending: true })

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
          .order("sort_order", { ascending: true })

        if (optionsError) {
          console.error(`Database error fetching options for items '${itemIds.join(",")}':`, optionsError.message)
          return { brand: null, error: "Could not fetch item options." }
        }

        const options: Option[] = optionsData || []

        // 5. Assemble the data structure
        items.forEach((item) => {
          item.options = options.filter((opt) => opt.item_id === item.id)
        })
      } else {
        items.forEach((item) => (item.options = []))
      }

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

export async function updateSectionOrder(brandId: number, sections: { id: number; position: number }[]) {
  const supabase = createClient()
  const updates = sections.map(({ id, position }) => supabase.from("sections").update({ position }).eq("id", id))

  const results = await Promise.all(updates)
  const error = results.find((res) => res.error)

  if (error) {
    return { success: false, message: "Failed to update section order." }
  }

  revalidatePath(`/admin/editor/${brandId}`, "page")
  return { success: true, message: "Section order saved." }
}

export async function updateItemOrder(sectionId: number, items: { id: number; position: number }[]) {
  const supabase = createClient()
  const updates = items.map(({ id, position }) => supabase.from("items").update({ position }).eq("id", id))

  const results = await Promise.all(updates)
  const error = results.find((res) => res.error)

  if (error) {
    return { success: false, message: "Failed to update item order." }
  }

  revalidatePath(`/admin/editor/section/${sectionId}`, "page")
  return { success: true, message: "Item order saved." }
}

export async function addSection(brandId: number, title: string) {
  const supabase = createClient()

  const { data: maxPosData, error: maxPosError } = await supabase
    .from("sections")
    .select("position")
    .eq("brand_id", brandId)
    .order("position", { ascending: false })
    .limit(1)
    .single()

  if (maxPosError && maxPosError.code !== "PGRST116") {
    return { success: false, message: "Could not determine section position." }
  }

  const newPosition = (maxPosData?.position ?? -1) + 1

  const { error } = await supabase.from("sections").insert({
    brand_id: brandId,
    title,
    position: newPosition,
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
