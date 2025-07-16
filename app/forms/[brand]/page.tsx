import { createAdminClient } from "@/utils/supabase/server"
import { notFound } from "next/navigation"
import { BrandFacingForm } from "@/components/brand-facing-form"
import type { BrandData, Item, Section } from "@/lib/types"
import { resolveAssetUrl } from "@/lib/utils"

export const revalidate = 0 // Revalidate data on every request

async function getBrandData(slug: string): Promise<BrandData | null> {
  const supabase = createAdminClient()

  const { data: brand, error: brandError } = await supabase
    .from("brands")
    .select(
      `
      id, name, slug, logo, emails, clinic_locations, active,
      sections (
        *,
        items (
          *,
          options (*)
        )
      )
    `,
    )
    .eq("slug", slug)
    .eq("active", true)
    .single()

  if (brandError || !brand) {
    console.error(`Error fetching brand data for slug '${slug}':`, brandError?.message)
    notFound()
  }

  // Ensure sections and items are sorted by position
  const sortedSections = ((brand.sections as Section[] | null) ?? []).sort((a, b) => a.position - b.position)
  sortedSections.forEach((section) => {
    if (section.items) {
      section.items.sort((a, b) => (a as Item).position - (b as Item).position)
      section.items.forEach((item) => {
        if ((item as Item).options) {
          ;(item as Item).options.sort((a, b) => a.sort_order - b.sort_order)
        }
      })
    }
  })

  // Resolve the logo pathname to a full URL
  const logoUrl = brand.logo ? resolveAssetUrl(brand.logo) : null

  return { ...brand, sections: sortedSections, logo: logoUrl } as BrandData
}

export default async function BrandFormPage({ params }: { params: { brand: string } }) {
  const brandData = await getBrandData(params.brand)

  if (!brandData) {
    notFound()
  }

  return <BrandFacingForm brandData={brandData} />
}
