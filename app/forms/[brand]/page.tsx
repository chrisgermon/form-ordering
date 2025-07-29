import { createAdminClient } from "@/utils/supabase/server"
import { notFound } from "next/navigation"
import { OrderForm } from "@/components/order-form"
import type { BrandData } from "@/lib/types"

export const revalidate = 0 // Revalidate data on every request

async function getBrandData(slug: string): Promise<BrandData | null> {
  try {
    const supabase = createAdminClient() // Moved inside the try...catch block

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

      const { data: fallbackBrand, error: fallbackError } = await supabase
        .from("brands")
        .select("id, name, slug, logo, email, active") // Note: 'email' and no 'clinic_locations'
        .eq("slug", slug)
        .eq("active", true)
        .maybeSingle()

      if (fallbackError) {
        console.error(`Error fetching brand with final fallback:`, JSON.stringify(fallbackError, null, 2))
        return null
      }
      brand = fallbackBrand
    } else if (brandError) {
      console.error(`Error fetching brand:`, JSON.stringify(brandError, null, 2))
      return null
    }

    if (!brand) {
      return null
    }

    // Step 2: Normalize the fetched brand data
    if (brand.email) {
      brand.emails = Array.isArray(brand.email) ? brand.email : [brand.email]
      delete brand.email
    } else if (!brand.emails) {
      brand.emails = []
    }

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
  } catch (error) {
    console.error(`A critical error occurred in getBrandData for slug '${slug}':`, error)
    // Return null to allow the page to show a 'notFound' state gracefully
    return null
  }
}

// This is a dynamic route handler
export default async function BrandFormPage({ params }: { params: { brand: string } }) {
  const brandData = await getBrandData(params.brand)

  if (!brandData) {
    notFound()
  }

  return <OrderForm brandData={brandData} />
}
