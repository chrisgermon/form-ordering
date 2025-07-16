"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import type { BrandData, Item, Option, Section } from "@/lib/types"
import { revalidatePath } from "next/cache"

export async function getBrand(slug: string): Promise<BrandData | null> {
  const supabase = createAdminClient()

  // Step 1: Fetch the core brand data.
  const { data: brand, error: brandError } = await supabase
    .from("brands")
    .select("id, name, slug, logo, emails, active")
    .eq("slug", slug)
    .single()

  if (brandError) {
    console.error(`Error fetching brand '${slug}':`, brandError.message)
    return null
  }

  // Step 2: Fetch related data in parallel using correct table names.
  const [locationsResult, sectionsResult] = await Promise.all([
    supabase.from("clinic_locations").select("*").eq("brand_id", brand.id),
    supabase.from("product_sections").select("*").eq("brand_id", brand.id).order("sort_order"),
  ])

  if (sectionsResult.error) {
    console.error(`Error fetching product_sections for brand ${slug}:`, sectionsResult.error.message)
    return null
  }

  const clinicLocations = locationsResult.data || []
  const productSections = sectionsResult.data || []

  // Step 3: Fetch items for each section and map to the expected `Section` type.
  const sections: Section[] = await Promise.all(
    productSections.map(async (pSection) => {
      const { data: productItems, error: itemsError } = await supabase
        .from("product_items")
        .select("*")
        .eq("section_id", pSection.id)
        .order("sort_order")

      if (itemsError) {
        console.error(`Error fetching items for section ${pSection.id}:`, itemsError.message)
        return null
      }

      const items: Item[] = (productItems || []).map((pItem) => ({
        ...pItem,
        position: pItem.sort_order,
        field_type: pItem.field_type || "text",
        options: (pItem.options as Option[]) || [],
      }))

      return {
        id: pSection.id,
        title: pSection.title,
        position: pSection.sort_order,
        brand_id: pSection.brand_id,
        items: items,
      }
    }),
  ).then((results) => results.filter((s): s is Section => s !== null))

  revalidatePath(`/forms/${slug}`)
  revalidatePath(`/admin/editor/${slug}`)

  return {
    ...brand,
    clinic_locations: clinicLocations,
    sections: sections,
  }
}

export async function getUploadedFiles() {
  const supabase = createAdminClient()
  const { data, error } = await supabase.storage.from("files").list("", {
    limit: 100,
    offset: 0,
    sortBy: { column: "created_at", order: "desc" },
  })

  if (error) {
    console.error("Error fetching files:", error)
    return []
  }
  return data
}
