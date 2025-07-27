"use server"

import { createAdminSupabaseClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import slugify from "slugify"
import type { Brand, ProductSection, ProductItem, Clinic } from "@/lib/types"

export type SectionData = Omit<ProductSection, "created_at" | "updated_at" | "brand_id"> & {
  product_items: (Omit<ProductItem, "created_at" | "updated_at" | "brand_id" | "section_id"> & {
    quantities: string // comma-separated
  })[]
}

export type FormData = Omit<Brand, "created_at" | "updated_at" | "product_sections" | "id" | "clinics"> & {
  id?: string
  sections: SectionData[]
  clinics: Clinic[]
}

type State = {
  success: boolean
  error: string | null
  brand: Brand | null
}

export async function saveForm(prevState: State, formData: FormData): Promise<State> {
  try {
    const supabase = createAdminSupabaseClient()

    // 1. Upsert Brand Details
    const brandSlug = formData.slug || slugify(formData.name, { lower: true, strict: true })

    const brandData = {
      name: formData.name,
      slug: brandSlug,
      logo: formData.logo,
      primary_color: formData.primary_color,
      email: formData.email,
      active: formData.active,
      clinics: formData.clinics || [],
    }

    const { data: savedBrand, error: brandError } = await supabase
      .from("brands")
      .upsert(formData.id ? { id: formData.id, ...brandData } : brandData)
      .select()
      .single()

    if (brandError) throw new Error(`Brand save error: ${brandError.message}`)
    if (!savedBrand) throw new Error("Failed to save brand, no data returned.")

    // 2. Handle Sections and Items
    const brandId = savedBrand.id
    const incomingSections = formData.sections || []

    // Get current sections to determine which to delete
    const { data: currentSections } = await supabase.from("product_sections").select("id").eq("brand_id", brandId)
    const currentSectionIds = currentSections?.map((s) => s.id) || []
    const incomingSectionIds = incomingSections.map((s) => s.id).filter((id) => !id.startsWith("new-"))

    // Delete sections that are no longer present
    const sectionsToDelete = currentSectionIds.filter((id) => !incomingSectionIds.includes(id))
    if (sectionsToDelete.length > 0) {
      await supabase.from("product_sections").delete().in("id", sectionsToDelete)
    }

    // Upsert sections
    for (const [index, section] of incomingSections.entries()) {
      const sectionData = {
        title: section.name,
        brand_id: brandId,
        sort_order: index,
      }
      const sectionId = section.id.startsWith("new-") ? undefined : section.id

      const { data: savedSection, error: sectionError } = await supabase
        .from("product_sections")
        .upsert(sectionId ? { id: sectionId, ...sectionData } : sectionData)
        .select()
        .single()

      if (sectionError) throw new Error(`Section save error: ${sectionError.message}`)
      if (!savedSection) throw new Error("Failed to save section.")

      // Handle items within the section
      const incomingItems = section.product_items || []

      // Get current items to determine which to delete
      const { data: currentItems } = await supabase.from("product_items").select("id").eq("section_id", savedSection.id)
      const currentItemIds = currentItems?.map((i) => i.id) || []
      const incomingItemIds = incomingItems.map((i) => i.id).filter((id) => !id.startsWith("new-"))

      // Delete items that are no longer present
      const itemsToDelete = currentItemIds.filter((id) => !incomingItemIds.includes(id))
      if (itemsToDelete.length > 0) {
        await supabase.from("product_items").delete().in("id", itemsToDelete)
      }

      // Upsert items
      for (const [itemIndex, item] of incomingItems.entries()) {
        const itemData = {
          code: item.code || slugify(item.name, { lower: true, strict: true }),
          name: item.name,
          description: item.description,
          quantities:
            typeof item.quantities === "string"
              ? item.quantities.split(",").map((s) => s.trim())
              : item.quantities || [],
          sample_link: item.sample_link,
          sort_order: itemIndex,
          section_id: savedSection.id,
          brand_id: brandId,
        }
        const itemId = item.id.startsWith("new-") ? undefined : item.id

        const { error: itemError } = await supabase
          .from("product_items")
          .upsert(itemId ? { id: itemId, ...itemData } : itemData)

        if (itemError) throw new Error(`Item save error: ${itemError.message}`)
      }
    }

    revalidatePath("/admin")
    revalidatePath("/")
    revalidatePath(`/forms/${brandSlug}`)
    if (formData.slug && formData.slug !== brandSlug) {
      revalidatePath(`/forms/${formData.slug}`)
    }

    return { success: true, error: null, brand: savedBrand }
  } catch (e) {
    const error = e as Error
    console.error("Error saving form:", error)
    return { success: false, error: error.message, brand: null }
  }
}
