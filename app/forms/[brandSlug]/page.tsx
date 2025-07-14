import { BrandFacingForm } from "@/components/brand-facing-form"
import { createClient } from "@/utils/supabase/server"
import type { BrandData } from "@/lib/types"
import { notFound } from "next/navigation"

async function getBrandData(slug: string): Promise<BrandData | null> {
  console.log(`Attempting to fetch brand data for slug: ${slug}`)
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
    .eq("active", true) // IMPORTANT: The brand must be active to be found.
    .single()

  if (error) {
    // This log is critical for debugging database query issues.
    console.error(`Database error fetching brand '${slug}':`, error.message)
    return null
  }

  if (!data) {
    // This log will appear in your Vercel deployment logs if the brand isn't found or is inactive.
    console.warn(`No active brand found for slug: '${slug}'. This is why a 404 is being shown.`)
    return null
  }

  console.log(`Successfully fetched brand: ${data.name}`)

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

export default async function BrandPage({ params }: { params: { brandSlug: string } }) {
  // This function fetches the brand data based on the URL slug (e.g., 'light-radiology')
  const brandData = await getBrandData(params.brandSlug)

  // If no brand is found (or it's not active), we explicitly show a 404 page.
  // The logs in getBrandData should tell you exactly why this is happening.
  if (!brandData) {
    notFound()
  }

  return <BrandFacingForm brandData={brandData} />
}
