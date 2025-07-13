"use server"

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"
import type { BrandWithSections } from "@/lib/types"

const revalidateEditor = (slug: string) => {
  revalidatePath(`/admin/editor/${slug}`, "page")
}

export async function getBrandForEditor(slug: string): Promise<BrandWithSections | null> {
  const supabase = createClient()
  const { data: brand, error } = await supabase
    .from("brands")
    .select(`
      *,
      sections (
        *,
        items:form_items (
          *
        )
      )
    `)
    .eq("slug", slug)
    .single()

  if (error || !brand) {
    console.error("Error fetching brand for editor:", error?.message)
    return null
  }

  // Sort sections and items by display_order
  brand.sections.sort((a, b) => a.display_order - b.display_order)
  brand.sections.forEach((section) => {
    section.items.sort((a, b) => a.display_order - b.display_order)
  })

  return brand as BrandWithSections
}

// Section Actions
export async function createSection(brandId: number, title: string) {
  const supabase = createClient()
  const { data: brand } = await supabase.from("brands").select("slug").eq("id", brandId).single()
  if (!brand) return { success: false, message: "Brand not found." }

  const { data: maxOrder } = await supabase
    .from("sections")
    .select("display_order")
    .eq("brand_id", brandId)
    .order("display_order", { ascending: false })
    .limit(1)
    .single()

  const newOrder = (maxOrder?.display_order ?? -1) + 1

  const { error } = await supabase.from("sections").insert({ brand_id: brandId, title, display_order: newOrder })

  if (error) {
    return { success: false, message: `Failed to create section: ${error.message}` }
  }

  revalidateEditor(brand.slug)
  return { success: true, message: "Section added successfully." }
}

export async function updateSection(sectionId: number, title: string) {
  const supabase = createClient()
  const { data: section } = await supabase.from("sections").select("brands(slug)").eq("id", sectionId).single()
  if (!section?.brands?.slug) return { success: false, message: "Section or brand not found." }

  const { error } = await supabase.from("sections").update({ title }).eq("id", sectionId)

  if (error) {
    return { success: false, message: `Failed to update section: ${error.message}` }
  }

  revalidateEditor(section.brands.slug)
  return { success: true, message: "Section updated." }
}

export async function deleteSection(sectionId: number) {
  const supabase = createClient()
  const { data: section } = await supabase.from("sections").select("brands(slug)").eq("id", sectionId).single()
  if (!section?.brands?.slug) return { success: false, message: "Section or brand not found." }

  const { error } = await supabase.from("sections").delete().eq("id", sectionId)

  if (error) {
    return { success: false, message: `Failed to delete section: ${error.message}` }
  }

  revalidateEditor(section.brands.slug)
  return { success: true, message: "Section deleted." }
}

export async function reorderSections(brandId: number, sections: { id: number; display_order: number }[]) {
  const supabase = createClient()
  const { data: brand } = await supabase.from("brands").select("slug").eq("id", brandId).single()
  if (!brand) return { success: false, message: "Brand not found." }

  const updates = sections.map((section) =>
    supabase.from("sections").update({ display_order: section.display_order }).eq("id", section.id),
  )

  const results = await Promise.all(updates)
  const firstError = results.find((res) => res.error)

  if (firstError) {
    return { success: false, message: `Failed to reorder sections: ${firstError.error.message}` }
  }

  revalidateEditor(brand.slug)
  return { success: true, message: "Sections reordered." }
}

// Item Actions
export async function deleteItem(itemId: number) {
  const supabase = createClient()
  const { data: item } = await supabase.from("form_items").select("sections(brands(slug))").eq("id", itemId).single()
  const slug = item?.sections?.brands?.slug
  if (!slug) return { success: false, message: "Item or brand not found." }

  const { error } = await supabase.from("form_items").delete().eq("id", itemId)

  if (error) {
    return { success: false, message: `Failed to delete item: ${error.message}` }
  }

  revalidateEditor(slug)
  return { success: true, message: "Item deleted." }
}

export async function reorderItems(sectionId: number, items: { id: number; display_order: number }[]) {
  const supabase = createClient()
  const { data: section } = await supabase.from("sections").select("brands(slug)").eq("id", sectionId).single()
  if (!section?.brands?.slug) return { success: false, message: "Section or brand not found." }

  const updates = items.map((item) =>
    supabase.from("form_items").update({ display_order: item.display_order }).eq("id", item.id),
  )

  const results = await Promise.all(updates)
  const firstError = results.find((res) => res.error)

  if (firstError) {
    return { success: false, message: `Failed to reorder items: ${firstError.error.message}` }
  }

  revalidateEditor(section.brands.slug)
  return { success: true, message: "Items reordered." }
}

// Form Actions
export async function clearForm(brandId: number) {
  const supabase = createClient()
  const { data: brand } = await supabase.from("brands").select("slug").eq("id", brandId).single()
  if (!brand) return { success: false, message: "Brand not found." }

  // Assumes ON DELETE CASCADE is set for form_items foreign key to sections
  const { error } = await supabase.from("sections").delete().eq("brand_id", brandId)

  if (error) {
    return { success: false, message: `Failed to clear form: ${error.message}` }
  }

  revalidateEditor(brand.slug)
  return { success: true, message: "Form cleared successfully." }
}
