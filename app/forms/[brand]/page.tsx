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

  const { data: brand, error: brandError } = await supabase
    .from("brands")
    .select("id, name, slug, logo, emails, clinic_locations, active")
    .eq("slug", slug)
    .eq("active", true)
    .maybeSingle()

  if (brandError || !brand) {
    console.error(`Error fetching brand '${slug}':`, brandError?.message || "Brand not found")
    return null
  }

  const { data: rawSections, error: sectionsError } = await supabase
    .from("sections")
    .select("*, items(*, options(value))")
    .eq("brand_id", brand.id)
    .order("position", { ascending: true })
    .order("position", { foreignTable: "items", ascending: true })

  if (sectionsError) {
    console.error(`Error fetching sections for brand '${slug}':`, sectionsError.message)
    // Return brand data but with empty sections to avoid a 404
    return { ...brand, sections: [] } as BrandData
  }

  const sections: Section[] = (rawSections as RawSection[]).map((section) => ({
    ...section,
    items: section.items.map((item) => ({
      ...item,
      options: item.options.map((opt) => opt.value),
    })),
  }))

  const finalBrandData = {
    ...brand,
    sections: sections,
  } as BrandData

  // Definitive check: This log will show up in your deployment's runtime logs.
  // It proves that the object being returned has "sections" and not "product_sections".
  console.log(`[getBrandData for '${slug}'] Final object keys:`, Object.keys(finalBrandData).join(", "))

  return finalBrandData
}

export default async function BrandFormPage({ params }: { params: { brand: string } }) {
  const brandData = await getBrandData(params.brand)

  if (!brandData) {
    notFound()
  }

  return <OrderForm brandData={brandData} />
}
