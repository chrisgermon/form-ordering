import { createAdminClient } from "@/utils/supabase/server"
import { notFound } from "next/navigation"
import { BrandFacingForm } from "@/components/brand-facing-form"
import type { Brand as BrandData, Section, Item, Option } from "@/lib/types"
import { resolveAssetUrl } from "@/lib/utils"

export const revalidate = 0 // Revalidate data on every request

async function getBrandData(slug: string): Promise<BrandData | null> {
  const supabase = createAdminClient()

  // 1. Fetch the active brand by slug
  const { data: brand, error: brandError } = await supabase
    .from("brands")
    .select("*")
    .eq("slug", slug)
    .eq("active", true)
    .single()

  if (brandError || !brand) {
    console.error(`No active brand found for slug '${slug}'. Error: ${brandError?.message}`)
    notFound()
  }

  // 2. Fetch all sections for the brand, ordered by position
  const { data: sections, error: sectionsError } = await supabase
    .from("sections")
    .select("*")
    .eq("brand_id", brand.id)
    .order("position", { ascending: true })

  if (sectionsError) {
    console.error(`Could not fetch form sections for brand ${brand.id}:`, sectionsError.message)
    notFound()
  }

  // 3. Fetch all items for the brand, ordered by position
  const { data: items, error: itemsError } = await supabase
    .from("items")
    .select("*")
    .eq("brand_id", brand.id)
    .order("position", { ascending: true })

  if (itemsError) {
    console.error(`Could not fetch form items for brand ${brand.id}:`, itemsError.message)
    notFound()
  }

  // 4. Fetch all options for the brand, ordered by sort_order
  const { data: options, error: optionsError } = await supabase
    .from("options")
    .select("*")
    .eq("brand_id", brand.id)
    .order("sort_order", { ascending: true })

  if (optionsError) {
    console.error(`Could not fetch form options for brand ${brand.id}:`, optionsError.message)
    notFound()
  }

  // 5. Assemble the data structure by joining in code
  const itemsWithOptionsMenu = (items || []).map((item: Item) => ({
    ...item,
    options: (options || []).filter((opt: Option) => opt.item_id === item.id),
  }))

  const sectionsWithItemsMenu = (sections || []).map((section: Section) => ({
    ...section,
    items: itemsWithOptionsMenu.filter((item: Item) => item.section_id === section.id),
  }))

  const logoUrl = brand.logo ? resolveAssetUrl(brand.logo) : null

  return {
    ...brand,
    logo: logoUrl,
    sections: sectionsWithItemsMenu,
  }
}

export default async function BrandFormPage({ params }) {
  const brandData = await getBrandData(params.brand)

  if (!brandData) {
    // This is redundant as getBrandData calls notFound(), but it's safe to keep.
    notFound()
  }

  return <BrandFacingForm brandData={brandData} />
}
