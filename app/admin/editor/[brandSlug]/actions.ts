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
      logo: formData.logo,
      email: formData.email,
      active: formData.active,
      clinics: formData.clinics,
    }

    let brandId: string

    if (formData.id) {
      // Update existing brand
      const { data: updatedBrand, error: brandError } = await supabase
        .from("brands")
        .update(brandData)
        .eq("id", formData.id)
        .select()
        .single()

      if (brandError) throw brandError
      brandId = updatedBrand.id
    } else {
      // Create new brand
      const { data: newBrand, error: brandError } = await supabase.from("brands").insert(brandData).select().single()

      if (brandError) throw brandError
      brandId = newBrand.id
    }

    // Delete existing sections and items for this brand
    await supabase.from("product_sections").delete().eq("brand_id", brandId)

    // Insert new sections and items
    for (const [sectionIndex, section] of formData.sections.entries()) {
      const { data: newSection, error: sectionError } = await supabase
        .from("product_sections")
        .insert({
          brand_id: brandId,
          title: section.name,
          description: section.description || "",
          sort_order: sectionIndex,
        })
        .select()
        .single()

      if (sectionError) throw sectionError

      // Insert items for this section
      for (const [itemIndex, item] of section.product_items.entries()) {
        const quantities = item.quantities
          ? item.quantities
              .split(",")
              .map((q) => q.trim())
              .filter(Boolean)
          : []

        const { error: itemError } = await supabase.from("product_items").insert({
          section_id: newSection.id,
          name: item.name,
          description: item.description || "",
          sample_link: item.sample_link || "",
          quantities,
          sort_order: itemIndex,
        })

        if (itemError) throw itemError
      }
    }

    // Fetch the updated brand data
    const { data: finalBrand, error: fetchError } = await supabase.from("brands").select().eq("id", brandId).single()

    if (fetchError) throw fetchError

    revalidatePath("/admin")
    revalidatePath(`/admin/editor/${formData.slug}`)
    revalidatePath(`/forms/${formData.slug}`)

    return {
      success: true,
      error: null,
      brand: finalBrand,
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
