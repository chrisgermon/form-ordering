// Force re-evaluation: 2025-07-13 14:09
import { createClient } from "@/utils/supabase/server"
import { notFound } from "next/navigation"
import { BrandFacingForm } from "@/components/brand-facing-form"
import type { BrandData } from "@/lib/types"

export const revalidate = 3600 // Revalidate every hour

export default async function FormPage({ params }: { params: { brand: string } }) {
  const supabase = createClient()

  const { data: brand, error: brandError } = await supabase
    .from("brands")
    .select(`*, sections(*, items(*, options(*)))`)
    .eq("slug", params.brand)
    .single()

  if (brandError || !brand) {
    console.error("Error fetching brand or brand not found:", brandError?.message)
    notFound()
  }

  // Ensure sections and items are sorted by position
  brand.sections.sort((a, b) => a.position - b.position)
  brand.sections.forEach((section) => {
    section.items.sort((a, b) => a.position - b.position)
  })

  const brandData: BrandData = {
    id: brand.id,
    name: brand.name,
    slug: brand.slug,
    logo_url: brand.logo_url,
    sections: brand.sections,
  }

  return <BrandFacingForm brandData={brandData} />
}
