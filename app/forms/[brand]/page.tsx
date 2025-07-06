import { createAdminClient } from "@/lib/supabase/admin"
import { notFound } from "next/navigation"
import { OrderForm } from "@/components/order-form"
import type { BrandData } from "@/lib/types"
import { Toaster } from "sonner"

export const revalidate = 0 // Revalidate data on every request

async function getBrandData(slug: string): Promise<BrandData | null> {
  const supabase = createAdminClient()

  // Step 1: Fetch the brand by slug, ensuring it's active
  const { data: brand, error: brandError } = await supabase
    .from("brands")
    .select("id, name, slug, logo_url, clinic_locations, active, order_prefix")
    .eq("slug", slug)
    .eq("active", true)
    .single()

  // If no active brand is found, or there's an error, return null
  if (brandError || !brand) {
    if (brandError) {
      console.error(`Error fetching brand:`, JSON.stringify(brandError, null, 2))
    }
    return null
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

  return (
    <>
      <OrderForm brandData={brandData} />
      <Toaster richColors />
    </>
  )
}
