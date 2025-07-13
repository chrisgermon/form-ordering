import { createAdminClient } from "@/utils/supabase/server"
import { notFound } from "next/navigation"
import { OrderForm } from "@/components/order-form"
import type { BrandData, Section, Item } from "@/lib/types"

export const revalidate = 0 // Revalidate data on every request

// These types represent the raw data from Supabase before we process it
interface RawItem extends Omit<Item, "options"> {
  options: { value: string }[]
}
interface RawSection extends Omit<Section, "items"> {
  items: RawItem[]
}

async function getBrandData(slug: string): Promise<BrandData | null> {
  const supabase = createAdminClient()

  // Step 1: Fetch the brand by slug, ensuring it's active
  const { data: brand, error: brandError } = await supabase
    .from("brands")
    .select("id, name, slug, logo, emails, clinic_locations, active")
    .eq("slug", slug)
    .eq("active", true)
    .maybeSingle()

  if (brandError || !brand) {
    if (brandError) console.error(`Error fetching brand:`, brandError.message)
    return null
  }

  // Step 2: Fetch all sections and their items with options for this brand
  const { data: rawSections, error: sectionsError } = await supabase
    .from("sections")
    .select("*, items(*, options(value))")
    .eq("brand_id", brand.id)
    .order("position", { ascending: true })
    .order("position", { foreignTable: "items", ascending: true })

  if (sectionsError) {
    console.error(`Error fetching sections for brand '${slug}':`, sectionsError.message)
    return { ...brand, sections: [] } as BrandData
  }

  // Step 3: Process the raw data to match the expected `BrandData` type
  // This involves converting the nested options objects into a simple string array
  const sections: Section[] = (rawSections as RawSection[]).map((section) => ({
    ...section,
    items: section.items.map((item) => ({
      ...item,
      options: item.options.map((opt) => opt.value),
    })),
  }))

  // Step 4: Assemble and return the final BrandData object
  const finalBrandData = {
    ...brand,
    sections: sections,
  } as BrandData

  return finalBrandData
}

// This is a dynamic route handler
export default async function BrandFormPage({ params }: { params: { brand: string } }) {
  const brandData = await getBrandData(params.brand)

  if (!brandData) {
    notFound()
  }

  return <OrderForm brandData={brandData} />
}
