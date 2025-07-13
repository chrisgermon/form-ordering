"use server"

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"

export async function addSection(brandId: string, title: string) {
  const supabase = createClient()

  // Get the current max order for sections of this brand
  const { data: maxOrderData, error: maxOrderError } = await supabase
    .from("sections")
    .select("order")
    .eq("brand_id", brandId)
    .order("order", { ascending: false })
    .limit(1)
    .single()

  if (maxOrderError && maxOrderError.code !== "PGRST116") {
    // PGRST116 means no rows found, which is fine.
    console.error("Error getting max order:", maxOrderError)
    return { success: false, message: "Could not determine section order." }
  }

  const newOrder = (maxOrderData?.order ?? -1) + 1

  const { error } = await supabase.from("sections").insert({
    brand_id: brandId,
    title: title,
    order: newOrder,
  })

  if (error) {
    console.error("Error adding section:", error)
    return { success: false, message: "Failed to add new section." }
  }

  revalidatePath(`/admin/editor/${brandId}`) // Use brandId or slug
  return { success: true, message: `Section "${title}" added successfully.` }
}

export async function clearForm(brandId: string) {
  const supabase = createClient()
  const { error } = await supabase.from("sections").delete().eq("brand_id", brandId)

  if (error) {
    console.error("Error clearing form:", error)
    return { success: false, message: "Failed to clear the form." }
  }

  revalidatePath(`/admin/editor/${brandId}`)
  return { success: true, message: "Form has been cleared." }
}

export async function importFormFromURL(brandId: string, url: string) {
  // Placeholder for AI import logic
  console.log(`Importing form for brand ${brandId} from ${url}`)
  await new Promise((resolve) => setTimeout(resolve, 1500))
  return { success: true, message: "Import feature is not yet implemented. This is a placeholder." }
}

// A full reordering implementation would require a database transaction
// to shift all affected items. This is a simplified version for now.
export async function reorderSection(payload: { sectionId: string; newOrder: number }) {
  const { sectionId, newOrder } = payload
  const supabase = createClient()

  const { error } = await supabase.from("sections").update({ order: newOrder }).eq("id", sectionId)

  if (error) {
    console.error("Error reordering section:", error)
    return { success: false, message: "Failed to reorder section." }
  }

  return { success: true }
}

export async function reorderItem(payload: { itemId: string; sectionId: string; newOrder: number }) {
  const { itemId, newOrder } = payload
  const supabase = createClient()

  const { error } = await supabase.from("items").update({ order: newOrder }).eq("id", itemId)

  if (error) {
    console.error("Error reordering item:", error)
    return { success: false, message: "Failed to reorder item." }
  }

  return { success: true }
}
