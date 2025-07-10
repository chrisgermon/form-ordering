"use server"

import { createServerSupabaseClient } from "@/lib/supabase"
import { revalidatePath } from "next/cache"
import type { Brand, UploadedFile } from "./types"

export async function getBrand(slug: string): Promise<Brand | null> {
  const supabase = createServerSupabaseClient()
  const { data: brand, error: brandError } = await supabase
    .from("brands")
    .select("id, name, slug, logo, emails, clinic_locations, active")
    .eq("slug", slug)
    .single()

  if (brandError || !brand) {
    console.error(`Error fetching brand for editor '${slug}':`, brandError?.message)
    return null
  }

  const { data: sections, error: sectionsError } = await supabase
    .from("product_sections")
    .select("*")
    .eq("brand_id", brand.id)
    .order("sort_order")

  if (sectionsError) {
    console.error(`Error fetching sections for brand '${slug}':`, sectionsError.message)
    return { ...brand, product_sections: [] } as Brand
  }

  const sectionsWithItems = await Promise.all(
    (sections || []).map(async (section) => {
      const { data: items, error: itemsError } = await supabase
        .from("product_items")
        .select("*")
        .eq("section_id", section.id)
        .order("sort_order")

      if (itemsError) {
        console.error(`Error fetching items for section '${section.title}':`, itemsError.message)
        return { ...section, product_items: [] }
      }
      return { ...section, product_items: items || [] }
    }),
  )

  return {
    ...brand,
    product_sections: sectionsWithItems,
  } as Brand
}

export async function getUploadedFiles(): Promise<UploadedFile[]> {
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase.from("uploaded_files").select("*").order("uploaded_at", { ascending: false })
  if (error) {
    console.error("Error fetching uploaded files:", error)
    return []
  }
  return data || []
}

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
