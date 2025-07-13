import { createAdminClient } from "@/utils/supabase/server"
import { notFound } from "next/navigation"
import { BrandFacingForm } from "@/components/brand-facing-form"
import type { Brand as BrandData } from "@/lib/types"
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
    // More detailed logging for easier debugging
    if (brandError) {
      console.error(`Database error fetching brand data for slug '${slug}':`, brandError.message)
    } else {
      console.warn(`No active brand found for slug '${slug}'. The form will not be displayed.`)
    }
    notFound()
  }

  // Ensure sections and items are sorted by position
  const sortedSections = (brand.sections || []).sort((a, b) => a.position - b.position)
  sortedSections.forEach((section) => {
    if (section.items) {
      section.items.sort((a, b) => a.position - b.position)
    }
  })

  // Resolve the logo pathname to a full URL
  const logoUrl = brand.logo ? resolveAssetUrl(brand.logo) : null

  return { ...brand, sections: sortedSections, logo: logoUrl }
}

export default async function BrandFormPage({ params }: { params: { brand: string } }) {
  const brandData = await getBrandData(params.brand)

  // This check is technically redundant because getBrandData calls notFound(),
  // but it's good practice to keep it.
  if (!brandData) {
    notFound()
  }

  return <BrandFacingForm brandData={brandData} />
}
