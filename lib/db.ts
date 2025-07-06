import { createAdminClient } from "@/lib/supabase/admin"
import type { Brand, BrandData } from "@/lib/types"

export async function getActiveBrands(): Promise<Pick<Brand, "id" | "name" | "slug" | "logo_url">[]> {
  const supabase = createAdminClient()
  try {
    const { data, error } = await supabase
      .from("brands")
      .select("id, name, slug, logo_url, active")
      .eq("active", true)
      .order("name", { ascending: true })

    if (error) {
      console.error("Error fetching active brands:", error)
      return []
    }
    return data || []
  } catch (error) {
    console.error("Unexpected error in getActiveBrands:", error)
    return []
  }
}

export async function getBrandBySlug(slug: string): Promise<BrandData | null> {
  const supabase = createAdminClient()
  try {
    // Step 1: Fetch brand, ensuring it's active. Using '*' is more robust to schema changes.
    const { data: brand, error: brandError } = await supabase
      .from("brands")
      .select("*")
      .eq("slug", slug)
      .eq("active", true)
      .single()

    if (brandError || !brand) {
      if (brandError) {
        console.error(`Error fetching brand by slug '${slug}':`, brandError.message)
      }
      return null
    }

    // Step 2: Fetch sections
    const { data: sections, error: sectionsError } = await supabase
      .from("product_sections")
      .select("*")
      .eq("brand_id", brand.id)
      .order("sort_order")

    if (sectionsError) {
      console.error(`Error fetching sections for brand '${slug}':`, sectionsError.message)
      return { ...brand, product_sections: [] }
    }

    // Step 3: Fetch items for each section
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

    // Step 4: Assemble and return final object
    return {
      ...brand,
      product_sections: sectionsWithItems,
    }
  } catch (error) {
    console.error(`Unexpected error in getBrandBySlug for slug '${slug}':`, error)
    return null
  }
}
