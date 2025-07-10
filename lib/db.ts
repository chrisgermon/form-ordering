import { createAdminClient } from "@/lib/supabase/admin"
import type { Brand, BrandData } from "@/lib/types"

export async function getActiveBrands(): Promise<Brand[]> {
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from("brands")
      .select("id, name, slug, logo, active")
      .eq("active", true)
      .order("name", { ascending: true })

    if (error) {
      console.error("Database error fetching active brands:", JSON.stringify(error, null, 2))
      // On a database query error, we can return an empty array to prevent a hard crash.
      // The page will then show a "No brands found" message.
      return []
    }

    return data || []
  } catch (error) {
    // This block catches more critical errors, like network issues or misconfiguration (e.g., missing env vars).
    // We should throw an error here so the page can display a proper error state to the user.
    console.error("Unexpected system error in getActiveBrands:", error)
    if (error instanceof Error) {
      throw new Error(`Failed to connect to the database: ${error.message}`)
    }
    throw new Error("An unknown error occurred while fetching brands.")
  }
}

export async function getBrandBySlug(slug: string): Promise<BrandData | null> {
  const supabase = createAdminClient()
  try {
    // Step 1: Fetch brand, ensuring it's active
    const { data: brand, error: brandError } = await supabase
      .from("brands")
      .select("id, name, slug, logo, emails, clinic_locations, active, order_prefix")
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
