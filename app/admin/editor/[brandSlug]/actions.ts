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
 * Parses the HTML content from a JotForm text element to extract item details.
 * This version is robust and not dependent on specific HTML structure or ordering.
 * @param html The HTML string from a JotForm 'control_text' element.
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

  // 1. Extract sample link first
  const sampleLinkMatch = html.match(/<a\s+href="([^"]+)"/)
  const sample_link = sampleLinkMatch ? sampleLinkMatch[1].replace(/&amp;/g, "&") : null

  // 2. Clean the HTML into a single string
  const textContent = html
    .replace(/<br\s*\/?>/gi, "|||") // Use a unique separator for line breaks
    .replace(/<\/(p|div|span|strong|em)>/gi, "|||") // Add separator at end of block elements
    .replace(/<[^>]+>/g, " ") // Remove all other tags
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim()

  // 3. Define keywords
  const keywords = ["CODE:", "ITEM:", "REFERRALS:", "PATIENT BROCHURES:", "DESCRIPTION:", "SAMPLE:"]

  // Function to extract value between two keywords
  const getValue = (startKeyword: string, text: string): string | null => {
    const upperText = text.toUpperCase()
    const upperStartKeyword = startKeyword.toUpperCase()
    const startIndex = upperText.indexOf(upperStartKeyword)
    if (startIndex === -1) return null

    const valueStart = startIndex + startKeyword.length
    let valueEnd = text.length

    // Find the start of the *next* keyword to define the boundary
    for (const nextKeyword of keywords) {
      if (nextKeyword.toUpperCase() === upperStartKeyword) continue
      const nextKeywordIndex = upperText.indexOf(nextKeyword.toUpperCase(), valueStart)
      if (nextKeywordIndex !== -1 && nextKeywordIndex < valueEnd) {
        valueEnd = nextKeywordIndex
      }
    }

    return text
      .substring(valueStart, valueEnd)
      .replace(/\|\|\|/g, "\n") // Restore newlines from our separator
      .replace(/\s\s+/g, " ") // Clean up multiple spaces
      .trim()
  }

  const code = getValue("CODE:", textContent)
  const description = getValue("DESCRIPTION:", textContent)
  const name =
    getValue("ITEM:", textContent) || getValue("REFERRALS:", textContent) || getValue("PATIENT BROCHURES:", textContent)

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
    const questions = Object.values(data.content || {})

    // First Pass: Build a map of product details from 'control_text' elements
    console.log("Starting JotForm import: First pass - building product details map...")
    const productDetailsMap = new Map<
      string,
      {
        name: string | null
        description: string | null
        sample_link: string | null
      }
    >()

    for (const question of questions) {
      const q = question as any
      if (q.type === "control_text") {
        const parsed = parseJotformItemHTML(q.text)
        if (parsed.code) {
          productDetailsMap.set(parsed.code, {
            name: parsed.name,
            description: parsed.description,
            sample_link: parsed.sample_link,
          })
          console.log(`Mapped code "${parsed.code}" to name "${parsed.name}"`)
        }
      }
    }
    console.log(`First pass complete. Found details for ${productDetailsMap.size} products.`)

    // Second Pass: Create sections and items by looking up details in the map
    console.log("Second pass - creating sections and items...")
    const sortedQuestions = (questions as any[]).sort((a, b) => Number(a.order) - Number(b.order))
    const supabase = createServerSupabaseClient()
    let currentSectionId: string | null = null
    let sectionSortOrder = 0
    let itemSortOrder = 0

    const { data: maxSortOrderData } = await supabase
      .from("product_sections")
      .select("sort_order")
      .eq("brand_id", brandId)
      .order("sort_order", { ascending: false })
      .limit(1)
      .single()
    sectionSortOrder = (maxSortOrderData?.sort_order ?? -1) + 1

    for (const question of sortedQuestions) {
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
        itemSortOrder = 0
      } else if (
        (q.type === "control_checkbox" || q.type === "control_radio" || q.type === "control_dropdown") &&
        currentSectionId
      ) {
        const productCode = q.text.trim()
        console.log(`Processing item with code: "${productCode}"`)
        const details = productDetailsMap.get(productCode)

        if (!details) {
          console.warn(`Could not find details for product code: "${productCode}". Skipping item.`)
          continue
        }
        console.log(`Found details for "${productCode}":`, details)

        const quantities = q.options ? q.options.split("|").map((opt: string) => opt.trim()) : []

        const newItem = {
          code: productCode,
          name: details.name || productCode, // Fallback to code if name is missing
          description: details.description,
          sample_link: details.sample_link,
          quantities: quantities,
          section_id: currentSectionId,
          brand_id: brandId,
          sort_order: itemSortOrder++,
        }

        const { error } = await supabase.from("product_items").insert(newItem)
        if (error) {
          console.error(`Database error importing item "${newItem.name}":`, error)
        } else {
          console.log(`Successfully inserted item "${newItem.name}"`)
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
