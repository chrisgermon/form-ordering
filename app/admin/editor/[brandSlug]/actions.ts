"use server"

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"
import type { Brand, Item, Option, Section } from "@/lib/types"

export async function getBrandForEditor(slug: string): Promise<{ brand: Brand | null; error: string | null }> {
  const supabase = createClient()
  try {
    const { data: brandData, error: brandError } = await supabase.from("brands").select("*").eq("slug", slug).single()

    if (brandError) {
      if (brandError.code === "PGRST116") {
        return { brand: null, error: `No brand with slug '${slug}' found.` }
      }
      throw brandError
    }

    const { data: sectionsData, error: sectionsError } = await supabase
      .from("sections")
      .select("*, items(*, options(*))")
      .eq("brand_id", brandData.id)
      .order("position", { ascending: true })
      .order("position", { foreignTable: "items", ascending: true })
      .order("sort_order", { foreignTable: "items.options", ascending: true })

    if (sectionsError) throw sectionsError

    const brand: Brand = {
      ...brandData,
      sections: sectionsData || [],
    }

    return { brand, error: null }
  } catch (e: any) {
    console.error("Error fetching brand for editor:", e.message)
    return { brand: null, error: "A database error occurred. Please check the schema and relationships." }
  }
}

export async function saveFormChanges(
  brandId: string,
  sections: Section[],
): Promise<{ success: boolean; message: string }> {
  const supabase = createClient()

  try {
    // Handle sections (update order, title)
    const sectionUpserts = sections.map((s) => ({
      id: s.id.toString().startsWith("new-") ? undefined : s.id,
      brand_id: brandId,
      title: s.title,
      position: s.position,
    }))

    const { data: savedSections, error: sectionError } = await supabase.from("sections").upsert(sectionUpserts).select()
    if (sectionError) throw new Error(`Section Save Error: ${sectionError.message}`)

    // Map new section IDs back for item processing
    const sectionIdMap = new Map<string, string>()
    sections.forEach((s) => {
      if (s.id.toString().startsWith("new-")) {
        const newId = savedSections.find((ss) => ss.title === s.title)?.id
        if (newId) sectionIdMap.set(s.id, newId)
      }
    })

    // Flatten all items and options
    const allItems: Item[] = []
    sections.forEach((s) => {
      s.items.forEach((i) => {
        const finalSectionId = sectionIdMap.get(s.id) || s.id
        allItems.push({ ...i, section_id: finalSectionId })
      })
    })

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

    const itemIdMap = new Map<string, string>()
    allItems.forEach((i) => {
      if (i.id.toString().startsWith("new-")) {
        const newId = savedItems.find((si) => si.name === i.name && si.section_id === i.section_id)?.id
        if (newId) itemIdMap.set(i.id, newId)
      }
    })

    // Delete options for all items in this form to resync
    const allItemIds = allItems.map((i) => itemIdMap.get(i.id) || i.id)
    if (allItemIds.length > 0) {
      await supabase.from("options").delete().in("item_id", allItemIds)
    }

    const allOptions: Partial<Option>[] = []
    allItems.forEach((i) => {
      if (i.options && i.options.length > 0) {
        const finalItemId = itemIdMap.get(i.id) || i.id
        i.options.forEach((o) => {
          allOptions.push({ ...o, item_id: finalItemId })
        })
      }
    })

    if (allOptions.length > 0) {
      const optionInserts = allOptions.map((o, index) => ({
        item_id: o.item_id,
        value: o.value,
        label: o.label,
        sort_order: index,
      }))
      const { error: optionError } = await supabase.from("options").insert(optionInserts)
      if (optionError) throw new Error(`Option Save Error: ${optionError.message}`)
    }

    revalidatePath(
      `/admin/editor/${(await supabase.from("brands").select("slug").eq("id", brandId).single()).data?.slug}`,
    )
    return { success: true, message: "Form saved successfully!" }
  } catch (e: any) {
    return { success: false, message: e.message }
  }
}

export async function deleteSectionAndItems(sectionId: string): Promise<{ success: boolean; message: string }> {
  const supabase = createClient()
  const { error } = await supabase.from("sections").delete().eq("id", sectionId)
  if (error) return { success: false, message: error.message }
  revalidatePath("/admin/editor/.*", "layout")
  return { success: true, message: "Section deleted." }
}

export async function deleteItemAndOptions(itemId: string): Promise<{ success: boolean; message: string }> {
  const supabase = createClient()
  const { error } = await supabase.from("items").delete().eq("id", itemId)
  if (error) return { success: false, message: error.message }
  revalidatePath("/admin/editor/.*", "layout")
  return { success: true, message: "Item deleted." }
}
