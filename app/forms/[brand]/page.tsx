import { createAdminClient } from "@/utils/supabase/server"
import { notFound } from "next/navigation"
import { BrandFacingForm } from "@/components/brand-facing-form"
import type { BrandData } from "@/lib/types"

export const revalidate = 0 // Revalidate data on every request

async function getBrandData(slug: string): Promise<BrandData | null> {
  const supabase = createAdminClient()

  // This nested select query is now possible because of the relationships
  // we are defining in the new SQL script.
  const { data: brand, error: brandError } = await supabase
    .from("brands")
    .select(`
      id, name, slug, logo_url, emails, clinic_locations, active,
      sections (
        *,
        items (
          *,
          options (*)
        )
      )
    `)
    .eq("slug", slug)
    .eq("active", true)
    .single()

  if (brandError || !brand) {
    console.error(`Error fetching brand data for slug '${slug}':`, brandError?.message)
    notFound()
  }

  // Ensure sections and items are sorted by position
  const sortedSections = brand.sections.sort((a, b) => a.position - b.position)
  sortedSections.forEach((section) => {
    section.items.sort((a, b) => a.position - b.position)
  })

  return { ...brand, sections: sortedSections } as BrandData
}

export default async function BrandFormPage({ params }: { params: { brand: string } }) {
  const brandData = await getBrandData(params.brand)

  if (!brandData) {
    notFound()
  }

  return <BrandFacingForm brandData={brandData} />
}
