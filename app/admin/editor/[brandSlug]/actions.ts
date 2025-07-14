"use server"

import { createAdminClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"
import type { Section } from "@/lib/types"
import { parseFormWithAI } from "@/lib/scraping"

export async function saveFormChanges(
  brandId: string,
  sections: Section[],
  deletedItemIds: string[],
  deletedSectionIds: string[],
) {
  const supabase = createAdminClient()

  // Handle deleted items and sections first
  if (deletedItemIds.length > 0) {
    const { error: deleteItemError } = await supabase.from("items").delete().in("id", deletedItemIds)
    if (deleteItemError) {
      console.error("Item Deletion Error:", deleteItemError)
      return { success: false, message: "Failed to delete one or more items." }
    }
  }

  if (deletedSectionIds.length > 0) {
    const { error: deleteSectionError } = await supabase.from("sections").delete().in("id", deletedSectionIds)
    if (deleteSectionError) {
      console.error("Section Deletion Error:", deleteSectionError)
      return {
        success: false,
        message: "Failed to delete one or more sections.",
      }
    }
  }

  // Prepare upserts for sections
  const sectionUpserts = sections.map((s, index) => ({
    id: s.id.toString().startsWith("new-") ? undefined : s.id,
    brand_id: brandId,
    title: s.title,
    position: index,
  }))

  const { data: savedSections, error: sectionError } = await supabase.from("sections").upsert(sectionUpserts).select()

  if (sectionError) {
    console.error("Section Save Error:", sectionError)
    return { success: false, message: "Failed to save sections." }
  }

  // Map old new-IDs to newly created UUIDs
  const sectionIdMap = new Map<string, string>()
  sections.forEach((s, index) => {
    if (s.id.toString().startsWith("new-")) {
      sectionIdMap.set(s.id.toString(), savedSections[index].id)
    }
  })

  // Prepare upserts for items
  const itemUpserts = sections.flatMap((s, sectionIndex) =>
    s.items.map((i, itemIndex) => ({
      id: i.id.toString().startsWith("new-") ? undefined : i.id,
      brand_id: brandId,
      section_id: sectionIdMap.get(s.id.toString()) || s.id,
      name: i.name,
      description: i.description,
      field_type: i.field_type,
      is_required: i.is_required,
      placeholder: i.placeholder,
      position: itemIndex,
    })),
  )

  if (itemUpserts.length > 0) {
    const { error: itemError } = await supabase.from("items").upsert(itemUpserts)
    if (itemError) {
      console.error("Item Save Error:", itemError)
      return { success: false, message: "Failed to save items." }
    }
  }

  revalidatePath(`/admin/editor/${brandId}`)
  return { success: true, message: "Form saved successfully!" }
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
