"use server"

import { createServerSupabaseClient } from "@/lib/supabase"
import { revalidatePath } from "next/cache"
import type { Brand } from "@/lib/types"

// This type should reflect the structure of the form data
export type FormData = {
  id?: string
  name: string
  slug: string
  logo: string | null
  email: string
  active: boolean
  clinics: string // Newline-separated string from a textarea
  sections: {
    id: string
    name: string
    description: string | null
    sort_order: number
    product_items: {
      id: string
      name: string
      description: string | null
      sample_link: string | null
      quantities: string // Comma-separated string from a textarea
      sort_order: number
    }[]
  }[]
}

type FormState = {
  success: boolean
  error: string | null
  brand: Brand | null
}

const slugify = (text: string) => {
  if (!text) return ""
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^\w-]+/g, "") // Remove all non-word chars
    .replace(/--+/g, "-") // Replace multiple - with single -
}

export async function saveForm(prevState: FormState, data: FormData): Promise<FormState> {
  const supabase = createServerSupabaseClient()

  try {
    // --- Brand Upsert ---
    const slug = slugify(data.slug || data.name)
    if (!slug) {
      return { success: false, error: "Brand name or slug is required to generate a slug.", brand: null }
    }

    const clinicsArray = data.clinics
      ? data.clinics
          .split("\n")
          .map((c) => c.trim())
          .filter(Boolean)
      : []

    const { data: savedBrand, error: brandError } = await supabase
      .from("brands")
      .upsert({
        id: data.id || undefined,
        name: data.name,
        slug: slug,
        logo: data.logo,
        primary_color: "#000000", // default or from form
        email: data.email,
        active: data.active,
        clinics: clinicsArray,
      })
      .select()
      .single()

    if (brandError) {
      console.error("Error saving brand:", brandError)
      if (brandError.code === "23505") {
        // unique constraint violation
        return { success: false, error: "A brand with this name or slug already exists.", brand: null }
      }
      throw brandError
    }

    const brandId = savedBrand.id

    // --- Sections and Items Upsert ---
    const allItemIdsFromForm: string[] = []
    const sectionsToUpsert = []
    const productItemsToUpsert = []

    for (const [sectionIndex, section] of data.sections.entries()) {
      sectionsToUpsert.push({
        id: section.id.startsWith("new-section-") ? undefined : section.id,
        brand_id: brandId,
        title: section.name,
        sort_order: sectionIndex,
      })

      for (const [itemIndex, item] of section.product_items.entries()) {
        allItemIdsFromForm.push(item.id)
        const quantitiesArray = item.quantities
          ? item.quantities
              .split(",")
              .map((q) => q.trim())
              .filter(Boolean)
          : []

        productItemsToUpsert.push({
          id: item.id.startsWith("new-item-") ? undefined : item.id,
          brand_id: brandId,
          section_id: section.id, // This will be wrong for new sections. We need to handle this.
          code: item.name.toUpperCase().replace(/\s+/g, "_"), // Generate a simple code
          name: item.name,
          description: item.description,
          sample_link: item.sample_link,
          quantities: quantitiesArray,
          sort_order: itemIndex,
        })
      }
    }

    // Upsert sections and get back the IDs
    const { data: savedSections, error: sectionsError } = await supabase
      .from("product_sections")
      .upsert(sectionsToUpsert)
      .select()

    if (sectionsError) throw sectionsError

    // Create a map of old (form) section IDs to new (DB) section IDs
    const sectionIdMap = new Map<string, string>()
    data.sections.forEach((formSection) => {
      const dbSection = savedSections.find((s) => s.title === formSection.name && s.brand_id === brandId)
      if (dbSection) {
        sectionIdMap.set(formSection.id, dbSection.id)
      }
    })

    // Update section_id for items before upserting
    const finalProductItemsToUpsert = productItemsToUpsert.map((item) => ({
      ...item,
      section_id: sectionIdMap.get(item.section_id) || item.section_id,
    }))

    const { error: itemsError } = await supabase.from("product_items").upsert(finalProductItemsToUpsert)
    if (itemsError) throw itemsError

    // --- Delete orphaned items and sections ---
    const { data: existingItems } = await supabase.from("product_items").select("id").eq("brand_id", brandId)
    const itemsToDelete = existingItems?.filter((item) => !allItemIdsFromForm.includes(item.id)).map((item) => item.id)

    if (itemsToDelete && itemsToDelete.length > 0) {
      await supabase.from("product_items").delete().in("id", itemsToDelete)
    }

    const allSectionIdsFromForm = data.sections.map((s) => s.id)
    const { data: existingSections } = await supabase.from("product_sections").select("id").eq("brand_id", brandId)
    const sectionsToDelete = existingSections
      ?.filter((section) => !allSectionIdsFromForm.includes(section.id))
      .map((section) => section.id)

    if (sectionsToDelete && sectionsToDelete.length > 0) {
      await supabase.from("product_sections").delete().in("id", sectionsToDelete)
    }

    revalidatePath("/")
    revalidatePath(`/admin/editor/${slug}`)
    revalidatePath(`/forms/${slug}`)

    return { success: true, error: null, brand: savedBrand }
  } catch (error) {
    console.error("An unexpected error occurred:", error)
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred."
    return { success: false, error: errorMessage, brand: null }
  }
}
