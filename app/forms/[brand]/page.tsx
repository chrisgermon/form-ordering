import { createAdminClient } from "@/utils/supabase/server"
import { notFound } from "next/navigation"
import { OrderForm } from "@/components/order-form"
import type { BrandData } from "@/lib/types"

export const revalidate = 0 // Revalidate data on every request

async function getBrandData(slug: string): Promise<BrandData | null> {
  const supabase = createAdminClient()

  // Step 1: Fetch the brand by slug, trying the ideal schema first.
  let brand: any
  let brandError: any
  ;({ data: brand, error: brandError } = await supabase
    .from("brands")
    .select("id, name, slug, logo, emails, clinic_locations, active")
    .eq("slug", slug)
    .eq("active", true)
    .maybeSingle())

  // If the first attempt fails with a "column does not exist" error, try a safer fallback.
  if (brandError && brandError.code === "42703") {
    console.warn("Fallback initiated for getBrandData due to schema error:", brandError.message)

    // This query is safer and only selects columns that are less likely to be missing.
    // It also tries to get the legacy 'email' column.
    const { data: fallbackBrand, error: fallbackError } = await supabase
      .from("brands")
      .select("id, name, slug, logo, email, active") // Note: 'email' and no 'clinic_locations'
      .eq("slug", slug)
      .eq("active", true)
      .maybeSingle()

    if (fallbackError) {
      // If even this very safe fallback fails, there's a bigger problem.
      console.error(`Error fetching brand with final fallback:`, JSON.stringify(fallbackError, null, 2))
      return null
    }
    brand = fallbackBrand
  } else if (brandError) {
    // Handle non-schema errors from the first attempt
    console.error(`Error fetching brand:`, JSON.stringify(brandError, null, 2))
    return null
  }

  // If no active brand is found after all attempts, return null
  if (!brand) {
    return null
  }

  // Step 2: Normalize the fetched brand data to match the expected BrandData type.
  // This ensures that downstream components don't break if columns were missing.

  // Normalize 'emails'
  if (brand.email) {
    brand.emails = Array.isArray(brand.email) ? brand.email : [brand.email]
    delete brand.email
  } else if (!brand.emails) {
    brand.emails = []
  }

  // Normalize 'clinic_locations'
  if (!brand.clinic_locations) {
    brand.clinic_locations = []
  }

  // Step 3: Fetch all product sections for this brand
  const { data: sections, error: sectionsError } = await supabase
    .from("product_sections")
    .select("*")
    .eq("brand_id", brand.id)
    .order("sort_order")

  if (sectionsError) {
    console.error(`Error fetching sections for brand '${slug}':`, sectionsError.message)
    return { ...brand, product_sections: [] } as BrandData
  }

  // Step 4: For each section, fetch its product items
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

  // Step 5: Assemble and return the final BrandData object
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
