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

export async function importFromJotform(brandId: string, brandSlug: string, jotformId: string) {
  const apiKey = process.env.JOTFORM_API_KEY
  if (!apiKey) {
    return { success: false, error: "JotForm API key is not configured." }
  }

  try {
    const response = await fetch(`https://api.jotform.com/form/${jotformId}/questions?apiKey=${apiKey}`)
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || `JotForm API request failed with status ${response.status}`)
    }

    const data = await response.json()
    const questions = Object.values(data.content || {}).sort((a: any, b: any) => Number(a.order) - Number(b.order))

    const supabase = createServerSupabaseClient()
    let currentSectionId: string | null = null
    let sectionSortOrder = 0
    let itemSortOrder = 0

    for (const q of questions) {
      const question = q as any
      if (question.type === "control_head") {
        const { data: newSection, error } = await supabase
          .from("product_sections")
          .insert({
            title: question.text,
            brand_id: brandId,
            sort_order: sectionSortOrder++,
          })
          .select("id")
          .single()

        if (error) throw new Error(`Failed to create section "${question.text}": ${error.message}`)
        currentSectionId = newSection.id
        itemSortOrder = 0 // Reset item order for new section
      } else if (question.type === "control_checkbox" && currentSectionId) {
        const quantities = question.options ? question.options.split("|").map((opt: string) => opt.trim()) : []
        const { error } = await supabase.from("product_items").insert({
          name: question.text,
          code: question.name,
          quantities: quantities,
          section_id: currentSectionId,
          brand_id: brandId,
          sort_order: itemSortOrder++,
        })
        if (error) console.warn(`Could not import item "${question.text}": ${error.message}`)
      }
    }

    revalidatePath(`/admin/editor/${brandSlug}`)
    return { success: true, message: "Form imported successfully from JotForm." }
  } catch (error) {
    console.error("Error importing from JotForm:", error)
    return { success: false, error: error instanceof Error ? error.message : "An unknown error occurred." }
  }
}
