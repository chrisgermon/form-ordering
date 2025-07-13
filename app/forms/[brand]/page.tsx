import { createAdminClient } from "@/utils/supabase/server"
import { notFound } from "next/navigation"
import { BrandFacingForm } from "@/components/brand-facing-form"
import type { Brand as BrandData } from "@/lib/types"
import { resolveAssetUrl } from "@/lib/utils"

export const revalidate = 0 // Revalidate data on every request

async function getBrandData(slug: string): Promise<BrandData | null> {
  const supabase = createAdminClient()

  const { data: brand, error } = await supabase
    .from("brands")
    .select(
      `
      id,
      name,
      slug,
      logo,
      emails,
      clinic_locations,
      active,
      sections (
        id,
        brand_id,
        title,
        position,
        items (
          id,
          section_id,
          brand_id,
          code,
          name,
          description,
          sample_link,
          field_type,
          placeholder,
          is_required,
          position,
          options (
            id,
            item_id,
            value,
            label,
            sort_order
          )
        )
      )
    `,
    )
    .eq("slug", slug)
    .eq("active", true)
    .single()

  if (error || !brand) {
    console.error(`Error fetching brand data for slug '${slug}':`, error?.message)
    notFound()
  }

  // Sort everything by position/sort_order to ensure correct display
  brand.sections.sort((a, b) => a.position - b.position)
  brand.sections.forEach((section) => {
    section.items.sort((a, b) => a.position - b.position)
    section.items.forEach((item) => {
      if (item.options) {
        item.options.sort((a, b) => a.sort_order - b.sort_order)
      }
    })
  })

  const logoUrl = brand.logo ? resolveAssetUrl(brand.logo) : null

  return {
    ...brand,
    logo: logoUrl,
  } as BrandData
}

export default async function BrandFormPage({ params }: { params: { brand: string } }) {
  const brandData = await getBrandData(params.brand)

  if (!brandData) {
    notFound()
  }

  return <BrandFacingForm brandData={brandData} />
}
