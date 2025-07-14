"use server"

import { createAdminClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"
import type { Section } from "@/lib/types"
import { parseFormWithAI } from "@/lib/scraping"
import { randomUUID } from "crypto"
import { slugify } from "@/lib/utils"

export async function saveFormChanges(
  brandId: string,
  sections: Section[],
  deletedItemIds: string[],
  deletedSectionIds: string[],
) {
  const supabase = createAdminClient()

  try {
    // Handle deletions first
    if (deletedItemIds.length > 0) {
      const { error } = await supabase.from("items").delete().in("id", deletedItemIds)
      if (error) throw new Error(`Item Deletion Error: ${error.message}`)
    }
    if (deletedSectionIds.length > 0) {
      const { error } = await supabase.from("sections").delete().in("id", deletedSectionIds)
      if (error) throw new Error(`Section Deletion Error: ${error.message}`)
    }

    // Process sections and items
    const sectionUpserts = []
    const itemUpserts = []
    const sectionIdMap = new Map<string, string>()

    // Explicitly generate UUIDs for new sections
    for (const s of sections) {
      let sectionId = s.id
      if (s.id.toString().startsWith("new-")) {
        const newId = randomUUID()
        sectionIdMap.set(s.id, newId)
        sectionId = newId
      }
      sectionUpserts.push({
        id: sectionId,
        brand_id: brandId,
        title: s.title,
        position: s.position,
      })

      // Explicitly generate UUIDs for new items
      for (const i of s.items) {
        const isNewItem = i.id.toString().startsWith("new-")
        const itemId = isNewItem ? randomUUID() : i.id

        // Generate a 'code' from the item name if it's a new item.
        // For existing items, use the code that's already there.
        const itemCode = isNewItem ? slugify(i.name) : i.code

        itemUpserts.push({
          id: itemId,
          brand_id: brandId,
          section_id: sectionIdMap.get(s.id) || s.id,
          name: i.name,
          code: itemCode, // Ensure 'code' is always provided
          description: i.description,
          field_type: i.field_type,
          is_required: i.is_required,
          placeholder: i.placeholder,
          position: i.position,
        })
      }
    }

    // Perform upserts
    if (sectionUpserts.length > 0) {
      const { error: sectionError } = await supabase.from("sections").upsert(sectionUpserts)
      if (sectionError) {
        console.error("Section Save Error Details:", sectionError)
        throw new Error(`Section Save Error: ${sectionError.message}`)
      }
    }

    if (itemUpserts.length > 0) {
      const { error: itemError } = await supabase.from("items").upsert(itemUpserts)
      if (itemError) {
        console.error("Item Save Error Details:", itemError)
        throw new Error(`Item Save Error: ${itemError.message}`)
      }
    }

    revalidatePath(`/admin/editor/${brandId}`)
    return { success: true, message: "Form saved successfully!" }
  } catch (error: any) {
    console.error("Error saving form changes:", error)
    return { success: false, message: error.message }
  }
}

export async function importFormFromHtml(brandId: string, htmlContent: string) {
  try {
    const parsedForm = await parseFormWithAI(htmlContent)
    if (!parsedForm || parsedForm.length === 0) {
      return { success: false, message: "Could not parse any sections from the HTML." }
    }

    const supabase = createAdminClient()
    const { error } = await supabase.rpc("import_form_from_ai", {
      p_brand_id: brandId,
      p_sections: parsedForm,
    })

    if (error) {
      console.error("Database import function error:", error)
      return { success: false, message: `Database error: ${error.message}` }
    }

    revalidatePath(`/admin/editor/${brandId}`)
    return { success: true, message: "Form imported successfully!" }
  } catch (error) {
    console.error("Import Error:", error)
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred."
    return { success: false, message: `Failed to import form: ${errorMessage}` }
  }
}
