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
    .eq("active", true) // The brand MUST be active to be found
    .single()

  if (error) {
    console.error(`Error fetching brand data for slug '${slug}':`, error.message)
    return null
  }

  // Sort sections and items by position for consistent display
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
  // This function fetches the brand data based on the URL slug (e.g., 'FR')
  const brandData = await getBrandData(params.brand)

  // If no brand is found (or it's not active), we explicitly show a 404 page.
  // Since your database has the correct record, this part should now succeed.
  if (!brandData) {
    notFound()
  }

  return <BrandFacingForm brandData={brandData} />
}
