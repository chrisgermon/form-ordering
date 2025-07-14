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

/**
 * Parses the HTML content from a JotForm question's text to extract item details.
 * This version uses precise regex and is not dependent on HTML structure.
 * @param html The HTML string from JotForm.
 * @returns An object containing the parsed code, name, description, and sample_link.
 */
function parseJotformItemHTML(html: string): {
  code: string | null
  name: string | null
  description: string | null
  sample_link: string | null
} {
  if (!html) {
    return { code: null, name: null, description: null, sample_link: null }
  }

  // 1. Extract sample link first, as it's the most unique element.
  const sampleLinkMatch = html.match(/<a\s+href="([^"]+)"/)
  const sample_link = sampleLinkMatch ? sampleLinkMatch[1].replace(/&amp;/g, "&") : null

  // 2. Clean the HTML into a single, space-separated string for reliable regex matching.
  const textContent = html
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<p[^>]*>/gi, " ")
    .replace(/<[^>]+>/g, " ") // Remove other tags
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim()

  // 3. Use precise regex with lookaheads to extract each value.
  // This prevents a value from "bleeding" into the next one.
  const codeMatch = textContent.match(/CODE:\s*([^\s]+)/i)
  const code = codeMatch ? codeMatch[1].trim() : null

  const nameMatch = textContent.match(/ITEM:\s*(.*?)(?=\s*(?:CODE:|DESCRIPTION:|SAMPLE:|$))/i)
  const name = nameMatch ? nameMatch[1].trim() : null

  const descriptionMatch = textContent.match(/DESCRIPTION:\s*(.*?)(?=\s*(?:CODE:|ITEM:|SAMPLE:|$))/i)
  const description = descriptionMatch ? descriptionMatch[1].trim() : null

  return {
    code,
    name,
    description,
    sample_link,
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

    // Get current max sort order for sections to append new ones
    const { data: maxSortOrderData } = await supabase
      .from("product_sections")
      .select("sort_order")
      .eq("brand_id", brandId)
      .order("sort_order", { ascending: false })
      .limit(1)
      .single()
    sectionSortOrder = (maxSortOrderData?.sort_order ?? -1) + 1

    for (const question of questions) {
      const q = question as any

      if (q.type === "control_head") {
        const { data: newSection, error } = await supabase
          .from("product_sections")
          .insert({
            title: q.text,
            brand_id: brandId,
            sort_order: sectionSortOrder++,
          })
          .select("id")
          .single()

        if (error) {
          console.warn(`Failed to create section "${q.text}": ${error.message}`)
          continue
        }
        currentSectionId = newSection.id
        itemSortOrder = 0 // Reset item sort order for the new section
      } else if (
        (q.type === "control_checkbox" || q.type === "control_radio" || q.type === "control_dropdown") &&
        currentSectionId
      ) {
        const quantities = q.options ? q.options.split("|").map((opt: string) => opt.trim()) : []

        // Use the new parsing function to extract details from HTML
        const parsedData = parseJotformItemHTML(q.text)
        const plainTextName = q.text.replace(/<[^>]+>/g, "").trim()

        const newItem = {
          name: parsedData.name || plainTextName, // Fallback to stripped text
          code: parsedData.code || q.name, // Fallback to JotForm's internal name
          description: parsedData.description || q.subLabel || null, // Fallback to subLabel
          sample_link: parsedData.sample_link,
          quantities: quantities,
          section_id: currentSectionId,
          brand_id: brandId,
          sort_order: itemSortOrder++,
        }

        const { error } = await supabase.from("product_items").insert(newItem)
        if (error) {
          console.warn(`Could not import item "${newItem.name}": ${error.message}`)
        }
      }
    }

    revalidatePath(`/admin/editor/${brandSlug}`)
    revalidatePath(`/forms/${brandSlug}`)
    return { success: true, message: "Form imported successfully from JotForm." }
  } catch (error) {
    console.error("Error importing from JotForm:", error)
    return { success: false, error: error instanceof Error ? error.message : "An unknown error occurred." }
  }
}

export async function clearForm(brandId: string, brandSlug: string) {
  if (!brandId) {
    return { success: false, error: "Brand ID is required." }
  }

  try {
    const supabase = createServerSupabaseClient()
    // Deleting sections will also delete all items within them due to the CASCADE rule in the database.
    const { error } = await supabase.from("product_sections").delete().eq("brand_id", brandId)

    if (error) throw error

    revalidatePath(`/admin/editor/${brandSlug}`)
    revalidatePath(`/forms/${brandSlug}`)
    return { success: true, message: "Form has been cleared successfully." }
  } catch (error) {
    console.error("Error clearing form:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to clear the form."
    return { success: false, error: errorMessage }
  }
}
