"use server"

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"
import type { Brand, Item, Option, Section } from "@/lib/types"

// Reverted to the more stable, multi-query version to avoid schema relationship issues.
export async function getBrandForEditor(slug: string): Promise<{ brand: Brand | null; error: string | null }> {
  const supabase = createClient()
  try {
    // 1. Fetch the brand
    const { data: brandData, error: brandError } = await supabase.from("brands").select("*").eq("slug", slug).single()

    if (brandError) {
      if (brandError.code === "PGRST116") {
        return { brand: null, error: `Could not find a brand with slug "${slug}". Please check the URL.` }
      }
      console.error(`Database error fetching brand '${slug}':`, brandError.message)
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

export async function saveFormChanges(
  brandId: string,
  sections: Section[],
  deletedItemIds: string[],
  deletedSectionIds: string[],
): Promise<{ success: boolean; message: string }> {
  const supabase = createClient()

  try {
    // 1. Handle Deletions
    if (deletedItemIds.length > 0) {
      const { error } = await supabase.from("items").delete().in("id", deletedItemIds)
      if (error) throw new Error(`Failed to delete items: ${error.message}`)
    }
    if (deletedSectionIds.length > 0) {
      const { error } = await supabase.from("sections").delete().in("id", deletedSectionIds)
      if (error) throw new Error(`Failed to delete sections: ${error.message}`)
    }

    // 2. Upsert Sections
    const sectionUpserts = sections.map((s) => ({
      id: s.id.toString().startsWith("new-") ? undefined : s.id,
      brand_id: brandId,
      title: s.title,
      position: s.position,
    }))

    const { data: savedSections, error: sectionError } = await supabase.from("sections").upsert(sectionUpserts).select()
    if (sectionError) throw new Error(`Section Save Error: ${sectionError.message}`)

    // 3. Map new section IDs back for item processing
    const sectionIdMap = new Map<string, string>()
    sections.forEach((s) => {
      if (s.id.toString().startsWith("new-")) {
        const newDbSection = savedSections.find((ss) => ss.title === s.title && ss.position === s.position)
        if (newDbSection) sectionIdMap.set(s.id, newDbSection.id)
      }
    })

    // 4. Flatten and Upsert Items
    const allItems: Item[] = []
    sections.forEach((s) => {
      s.items.forEach((i) => {
        const finalSectionId = sectionIdMap.get(s.id) || s.id
        allItems.push({ ...i, section_id: finalSectionId })
      })
    })

    if (allItems.length > 0) {
      const itemUpserts = allItems.map((i) => ({
        id: i.id.toString().startsWith("new-") ? undefined : i.id,
        section_id: i.section_id,
        brand_id: brandId,
        name: i.name,
        description: i.description,
        field_type: i.field_type,
        is_required: i.is_required,
        placeholder: i.placeholder,
        position: i.position,
      }))

      const { data: savedItems, error: itemError } = await supabase.from("items").upsert(itemUpserts).select()
      if (itemError) throw new Error(`Item Save Error: ${itemError.message}`)

      // 5. Map new item IDs for option processing
      const itemIdMap = new Map<string, string>()
      allItems.forEach((i) => {
        if (i.id.toString().startsWith("new-")) {
          const newDbItem = savedItems.find(
            (si) => si.name === i.name && si.position === i.position && si.section_id === i.section_id,
          )
          if (newDbItem) itemIdMap.set(i.id, newDbItem.id)
        }
      })

      // 6. Batch delete and re-insert options for simplicity and correctness
      const allDbItemIds = allItems.map((i) => itemIdMap.get(i.id) || i.id)
      if (allDbItemIds.length > 0) {
        await supabase.from("options").delete().in("item_id", allDbItemIds)

        const allOptions: Partial<Option>[] = []
        allItems.forEach((i) => {
          if (i.options && i.options.length > 0) {
            const finalItemId = itemIdMap.get(i.id) || i.id
            i.options.forEach((o, index) => {
              allOptions.push({
                item_id: finalItemId,
                value: o.value,
                label: o.label,
                sort_order: index,
              })
            })
          }
        })

        if (allOptions.length > 0) {
          const { error: optionError } = await supabase.from("options").insert(allOptions)
          if (optionError) throw new Error(`Option Save Error: ${optionError.message}`)
        }
      }
    }

    const { data: brandData } = await supabase.from("brands").select("slug").eq("id", brandId).single()
    if (brandData?.slug) {
      revalidatePath(`/admin/editor/${brandData.slug}`)
      revalidatePath(`/forms/${brandData.slug}`)
    }

    return { success: true, message: "Form saved successfully!" }
  } catch (e: any) {
    console.error("Error saving form changes:", e.message)
    return { success: false, message: `Failed to save changes: ${e.message}` }
  }
}
