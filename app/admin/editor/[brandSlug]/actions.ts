"use server"

import { createServerSupabaseClient } from "@/lib/supabase"
import { revalidatePath } from "next/cache"

export async function updateSectionOrder(brandSlug: string, orderedSectionIds: string[]) {
  try {
    const supabase = createServerSupabaseClient()
    const updates = orderedSectionIds.map((id, index) =>
      supabase.from("product_sections").update({ sort_order: index }).eq("id", id),
    )

    const results = await Promise.all(updates)
    const error = results.find((res) => res.error)

    if (error) throw error.error

    revalidatePath(`/admin/editor/${brandSlug}`)
    revalidatePath(`/forms/${brandSlug}`)
    return { success: true }
  } catch (error) {
    console.error("Error updating section order:", error)
    return { success: false, error: "Failed to update section order." }
  }
}

export async function updateItemOrder(brandSlug: string, orderedItemIds: string[]) {
  try {
    const supabase = createServerSupabaseClient()
    const updates = orderedItemIds.map((id, index) =>
      supabase.from("product_items").update({ sort_order: index }).eq("id", id),
    )

    const results = await Promise.all(updates)
    const error = results.find((res) => res.error)

    if (error) throw error.error

    revalidatePath(`/admin/editor/${brandSlug}`)
    revalidatePath(`/forms/${brandSlug}`)
    return { success: true }
  } catch (error) {
    console.error("Error updating item order:", error)
    return { success: false, error: "Failed to update item order." }
  }
}
