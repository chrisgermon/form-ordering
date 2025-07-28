"use server"

import { createAdminSupabaseClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { Brand, Clinic } from "@/lib/types"

export type FormData = {
  id: string
  name: string
  slug: string
  logo: string
  email: string
  active: boolean
  clinics: Clinic[]
  sections: Array<{
    id: string
    name: string
    description?: string
    sort_order: number
    product_items: Array<{
      id: string
      name: string
      description?: string
      sample_link?: string
      quantities: string
      sort_order: number
    }>
  }>
}

export async function saveForm(
  prevState: { success: boolean; error: string | null; brand: Brand | null },
  formData: FormData,
): Promise<{ success: boolean; error: string | null; brand: Brand | null }> {
  try {
    const supabase = createAdminSupabaseClient()

    // Prepare brand data
    const brandData = {
      name: formData.name,
      slug: formData.slug,
      logo: formData.logo || null,
      email: formData.email,
      active: formData.active,
      clinics: formData.clinics || [],
    }

    let brand: Brand

    if (formData.id) {
      // Update existing brand
      const { data, error } = await supabase.from("brands").update(brandData).eq("id", formData.id).select().single()

      if (error) throw error
      brand = data
    } else {
      // Create new brand
      const { data, error } = await supabase.from("brands").insert(brandData).select().single()

      if (error) throw error
      brand = data
    }

    // Handle sections
    if (formData.sections && formData.sections.length > 0) {
      // Delete existing sections for this brand
      await supabase.from("product_sections").delete().eq("brand_id", brand.id)

      // Insert new sections
      for (const [index, section] of formData.sections.entries()) {
        const sectionData = {
          brand_id: brand.id,
          title: section.name,
          description: section.description || null,
          sort_order: index,
        }

        const { data: sectionResult, error: sectionError } = await supabase
          .from("product_sections")
          .insert(sectionData)
          .select()
          .single()

        if (sectionError) throw sectionError

        // Insert items for this section
        if (section.product_items && section.product_items.length > 0) {
          for (const [itemIndex, item] of section.product_items.entries()) {
            const quantities = item.quantities
              ? item.quantities
                  .split(",")
                  .map((q) => q.trim())
                  .filter(Boolean)
              : []

            const itemData = {
              product_section_id: sectionResult.id,
              name: item.name,
              description: item.description || null,
              sample_link: item.sample_link || null,
              quantities,
              sort_order: itemIndex,
            }

            const { error: itemError } = await supabase.from("product_items").insert(itemData)

            if (itemError) throw itemError
          }
        }
      }
    }

    revalidatePath("/admin")
    revalidatePath(`/admin/editor/${brand.slug}`)
    revalidatePath(`/forms/${brand.slug}`)

    return {
      success: true,
      error: null,
      brand,
    }
  } catch (error) {
    console.error("Error saving form:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
      brand: null,
    }
  }
}
