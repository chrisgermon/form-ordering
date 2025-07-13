"use server"

import { createAdminClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"
import type { Brand, Item, Option } from "@/lib/types"

export async function getBrandForEditor(slug: string): Promise<Brand | null> {
  const supabase = createAdminClient()

  // 1. Fetch brand more robustly
  const { data: brands, error: brandError } = await supabase
    .from("brands")
    .select("id, name, slug, logo, emails, clinic_locations, active")
    .eq("slug", slug)
    .limit(1)

  if (brandError) {
    console.error(`Error fetching brand '${slug}':`, brandError.message)
    return null
  }

  if (!brands || brands.length === 0) {
    console.error(`No brand found with slug: ${slug}`)
    return null
  }

  const brandData = brands[0]

  // 2. Fetch sections
  const { data: sectionsData, error: sectionsError } = await supabase
    .from("sections")
    .select("*")
    .eq("brand_id", brandData.id)
    .order("position")

  if (sectionsError) {
    console.error(`Error fetching sections for brand '${brandData.name}':`, sectionsError.message)
    return { ...brandData, sections: [] } as Brand
  }

  if (!sectionsData || sectionsData.length === 0) {
    return { ...brandData, sections: [] } as Brand
  }

  const sectionIds = sectionsData.map((s) => s.id)

  // 3. Fetch items
  const { data: itemsData, error: itemsError } = await supabase
    .from("items")
    .select("*")
    .in("section_id", sectionIds)
    .order("position")

  if (itemsError) {
    console.error(`Error fetching items for brand '${brandData.name}':`, itemsError.message)
    const sectionsWithEmptyItems = sectionsData.map((s) => ({ ...s, items: [] }))
    return { ...brandData, sections: sectionsWithEmptyItems } as Brand
  }

  const itemIds = itemsData.map((i) => i.id)
  let optionsData: Option[] = []

  if (itemIds.length > 0) {
    // 4. Fetch options
    const { data, error: optionsError } = await supabase
      .from("options")
      .select("*")
      .in("item_id", itemIds)
      .order("sort_order")

    if (optionsError) {
      console.error(`Error fetching options for brand '${brandData.name}':`, optionsError.message)
    } else {
      optionsData = data || []
    }
  }

  // 5. Stitch data together
  const itemsWithOptionsMenu = itemsData.map((item) => ({
    ...item,
    options: optionsData.filter((opt) => opt.item_id === item.id),
  }))

  const sectionsWithItemsMenu = sectionsData.map((section) => ({
    ...section,
    items: itemsWithOptionsMenu.filter((item) => item.section_id === section.id),
  }))

  return {
    ...brandData,
    sections: sectionsWithItemsMenu,
  } as Brand
}

export async function updateSectionOrder(brandSlug: string, orderedSectionIds: string[]) {
  const supabase = createAdminClient()
  const updates = orderedSectionIds.map((id, index) => ({ id, position: index }))
  const { error } = await supabase.from("sections").upsert(updates)
  if (error) return { success: false, error: error.message }
  revalidatePath(`/admin/editor/${brandSlug}`)
  return { success: true }
}

export async function updateItemOrder(brandSlug: string, sectionId: string, orderedItemIds: string[]) {
  const supabase = createAdminClient()
  const updates = orderedItemIds.map((id, index) => ({ id, position: index, section_id: sectionId }))
  const { error } = await supabase.from("items").upsert(updates)
  if (error) return { success: false, error: error.message }
  revalidatePath(`/admin/editor/${brandSlug}`)
  return { success: true }
}

export async function createSection(brandId: string, title: string) {
  const supabase = createAdminClient()
  const { data: maxPos, error: posError } = await supabase
    .from("sections")
    .select("position")
    .eq("brand_id", brandId)
    .order("position", { ascending: false })
    .limit(1)
    .single()
  if (posError && posError.code !== "PGRST116") return { success: false, error: posError.message }

  const { data, error } = await supabase
    .from("sections")
    .insert({ brand_id: brandId, title, position: (maxPos?.position ?? -1) + 1 })
    .select()
    .single()

  if (error) return { success: false, error: error.message }
  revalidatePath(`/admin/editor/*`)
  return { success: true, data }
}

export async function deleteSection(id: string) {
  const supabase = createAdminClient()
  const { error } = await supabase.from("sections").delete().eq("id", id)
  if (error) return { success: false, error: error.message }
  revalidatePath(`/admin/editor/*`)
  return { success: true }
}

export async function createItem(itemData: Partial<Item>) {
  const supabase = createAdminClient()
  const { options, ...coreItem } = itemData

  const { data: maxPos, error: posError } = await supabase
    .from("items")
    .select("position")
    .eq("section_id", coreItem.section_id!)
    .order("position", { ascending: false })
    .limit(1)
    .single()
  if (posError && posError.code !== "PGRST116") return { success: false, error: posError.message }

  const { data: newItem, error: itemError } = await supabase
    .from("items")
    .insert({ ...coreItem, position: (maxPos?.position ?? -1) + 1 })
    .select()
    .single()

  if (itemError) return { success: false, error: itemError.message }

  if (options && options.length > 0) {
    const optionsToInsert = options.map((opt, i) => ({ ...opt, item_id: newItem.id, sort_order: i }))
    const { error: optError } = await supabase.from("options").insert(optionsToInsert)
    if (optError) return { success: false, error: optError.message }
  }

  revalidatePath(`/admin/editor/*`)
  return { success: true, data: newItem }
}

export async function updateItem(itemData: Partial<Item>) {
  const supabase = createAdminClient()
  const { id, options, ...coreItem } = itemData

  const { error: itemError } = await supabase.from("items").update(coreItem).eq("id", id!)
  if (itemError) return { success: false, error: itemError.message }

  const { error: deleteError } = await supabase.from("options").delete().eq("item_id", id!)
  if (deleteError) return { success: false, error: deleteError.message }

  if (options && options.length > 0) {
    const optionsToInsert = options.map((opt, i) => ({ ...opt, item_id: id, sort_order: i }))
    const { error: optError } = await supabase.from("options").insert(optionsToInsert)
    if (optError) return { success: false, error: optError.message }
  }

  revalidatePath(`/admin/editor/*`)
  return { success: true }
}

export async function deleteItem(id: string) {
  const supabase = createAdminClient()
  const { error } = await supabase.from("items").delete().eq("id", id)
  if (error) return { success: false, error: error.message }
  revalidatePath(`/admin/editor/*`)
  return { success: true }
}
