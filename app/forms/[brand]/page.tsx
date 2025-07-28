import { createAdminClient } from "@/utils/supabase/server"
import { notFound } from "next/navigation"
import { OrderForm } from "@/components/order-form"
import type { BrandData } from "@/lib/types"

export const revalidate = 0 // Revalidate data on every request

async function getBrandData(slug: string): Promise<BrandData | null> {
  const supabase = createAdminClient()

  // Step 1: Fetch the brand by slug, ensuring it's active
  let brand: any
  let brandError: any

  // Try fetching with the ideal schema first (plural 'emails')
  ;({ data: brand, error: brandError } = await supabase
    .from("brands")
    .select("id, name, slug, logo, emails, clinic_locations, active")
    .eq("slug", slug)
    .eq("active", true)
    .maybeSingle())

  // If that fails due to a missing column, try a fallback
  if (brandError && brandError.code === "42703") {
    console.warn("Fallback initiated for getBrandData due to schema error:", brandError.message)

    // This query attempts to select legacy column names
    const { data: fallbackBrand, error: fallbackError } = await supabase
      .from("brands")
      .select("id, name, slug, logo, email, clinic_locations, active") // Note: 'email' (singular)
      .eq("slug", slug)
      .eq("active", true)
      .maybeSingle()

    if (fallbackError) {
      // If even the fallback fails, log the error and exit
      console.error(`Error fetching brand with fallback:`, JSON.stringify(fallbackError, null, 2))
      return null
    }

    brand = fallbackBrand

    // Normalize the data: ensure 'emails' property exists and is an array
    if (brand && brand.email) {
      brand.emails = Array.isArray(brand.email) ? brand.email : [brand.email]
      delete brand.email // remove the old property
    } else if (brand) {
      brand.emails = [] // ensure it's at least an empty array
    }
  } else if (brandError) {
    // If there was an error other than missing column, log it and exit
    console.error(`Error fetching brand:`, JSON.stringify(brandError, null, 2))
    return null
  }

  // If no active brand is found after all attempts, return null
  if (!brand) {
    return null
  }

  // Ensure clinic_locations is an array if it's null
  if (!brand.clinic_locations) {
    brand.clinic_locations = []
  }

  // Step 2: Fetch all product sections for this brand
  const { data: sections, error: sectionsError } = await supabase
    .from("product_sections")
    .select("*")
    .eq("brand_id", brand.id)
    .order("sort_order")

  if (sectionsError) {
    console.error(`Error fetching sections for brand '${slug}':`, sectionsError.message)
    // Return the brand but with empty sections, preventing a 404
    return { ...brand, product_sections: [] } as BrandData
  }

  // Step 3: For each section, fetch its product items
  const sectionsWithItems = await Promise.all(
    (sections || []).map(async (section) => {
      const { data: items, error: itemsError } = await supabase
        .from("product_items")
        .select("*")
        .eq("section_id", section.id)
        .order("sort_order")

      if (itemsError) {
        console.error(`Error fetching items for section '${section.title}':`, itemsError.message)
        // If items fail to load, return the section with an empty item list
        return { ...section, product_items: [] }
      }
      return { ...section, product_items: items || [] }
    }),
  )

  // Step 4: Assemble and return the final BrandData object
  return {
    ...brand,
    product_sections: sectionsWithItems,
  } as BrandData
}

// This is a dynamic route handler
export default async function BrandFormPage({ params }: { params: { brand: string } }) {
  const brandData = await getBrandData(params.brand)

  if (!brandData) {
    notFound()
  }

  return <OrderForm brandData={brandData} />
}
