import { BrandFacingForm } from "@/components/brand-facing-form"
import { createClient } from "@/utils/supabase/server"
import type { BrandData } from "@/lib/types"
import { notFound } from "next/navigation"

async function getBrandData(slug: string): Promise<BrandData | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("brands")
    .select(
      `
      *,
      clinic_locations(*),
      sections:sections (
        *,
        items:items (
          *,
          options:options (*)
        )
      )
    `,
    )
    .eq("slug", slug)
    .eq("active", true)
    .single()

  if (error) {
    console.error("Error fetching brand data:", error.message)
    return null
  }

  // Sort sections and items by position
  if (data.sections) {
    data.sections.sort((a, b) => a.position - b.position)
    for (const section of data.sections) {
      if (section.items) {
        section.items.sort((a, b) => a.position - b.position)
      }
    }
  }

  return data as BrandData
}

export default async function BrandPage({ params }: { params: { brand: string } }) {
  const brandData = await getBrandData(params.brand)

  if (!brandData) {
    notFound()
  }

  return <BrandFacingForm brandData={brandData} />
}
