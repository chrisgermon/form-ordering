"use server"

import { createAdminClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"
import type { Section } from "@/lib/types"
import { parseFormWithAI } from "@/lib/scraping"

export async function getBrandForEditor(slug: string) {
  const supabase = createAdminClient()
  const { data: brand, error } = await supabase
    .from("brands")
    .select("*, sections(*, items(*))")
    .eq("slug", slug)
    .single()

  if (error) {
    console.error("Error fetching brand:", error)
    return null
  }

  // Sort sections and items by position
  brand.sections.sort((a, b) => a.position - b.position)
  brand.sections.forEach((section) => {
    section.items.sort((a, b) => a.position - b.position)
  })

  return brand
}

export async function saveFormChanges(
  brandId: string,
  sections: Section[],
  deletedItemIds: string[],
  deletedSectionIds: string[],
) {
  const supabase = createAdminClient()

  const sectionUpserts = sections.map((s) => ({
    id: s.id.toString().startsWith("new-") ? undefined : s.id,
    brand_id: brandId,
    title: s.title,
    position: s.position,
  }))

  const { data: savedSections, error: sectionError } = await supabase.from("sections").upsert(sectionUpserts).select()

  if (sectionError) {
    console.error("Section Save Error:", sectionError)
    return { success: false, message: `Section Save Error: ${sectionError.message}` }
  }

  const sectionIdMap = new Map(
    sections.filter((s) => s.id.toString().startsWith("new-")).map((s, i) => [s.id, savedSections[i].id]),
  )

  const allItems = sections.flatMap((s) =>
    s.items.map((i) => ({
      ...i,
      section_id: sectionIdMap.get(s.id) || s.id,
    })),
  )

  const itemUpserts = allItems.map((i) => ({
    id: i.id.toString().startsWith("new-") ? undefined : i.id,
    brand_id: brandId,
    section_id: i.section_id,
    name: i.name,
    description: i.description,
    field_type: i.field_type,
    is_required: i.is_required,
    placeholder: i.placeholder,
    position: i.position,
  }))

  if (itemUpserts.length > 0) {
    const { error: itemError } = await supabase.from("items").upsert(itemUpserts)
    if (itemError) {
      console.error("Item Save Error:", itemError)
      return { success: false, message: `Item Save Error: ${itemError.message}` }
    }
  }

  if (deletedItemIds.length > 0) {
    const { error: deleteItemError } = await supabase.from("items").delete().in("id", deletedItemIds)
    if (deleteItemError) console.error("Error deleting items:", deleteItemError)
  }

  if (deletedSectionIds.length > 0) {
    const { error: deleteSectionError } = await supabase.from("sections").delete().in("id", deletedSectionIds)
    if (deleteSectionError) console.error("Error deleting sections:", deleteSectionError)
  }

  revalidatePath(`/admin/editor/${brandId}`)
  return { success: true, message: "Form saved successfully!" }
}

export async function importFormFromHtml(brandId: string, htmlContent: string) {
  const supabase = createAdminClient()

  try {
    const parsedForm = await parseFormWithAI(htmlContent)
    if (!parsedForm || !parsedForm.sections) {
      throw new Error("AI parsing failed to return a valid form structure.")
    }

    const { error: rpcError } = await supabase.rpc("import_form_from_ai", {
      p_brand_id: brandId,
      p_sections: parsedForm.sections,
    })

    if (rpcError) {
      console.error("Error calling import_form_from_ai RPC:", rpcError)
      throw new Error(`Database import failed: ${rpcError.message}`)
    }

    revalidatePath(`/admin/editor/${brandId}`)
    return { success: true, message: "Form imported successfully!" }
  } catch (error: any) {
    console.error("Import failed:", error)
    return { success: false, message: error.message || "An unknown error occurred during import." }
  }
}
