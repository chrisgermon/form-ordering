import { createClient } from "@/utils/supabase/server"
import { notFound } from "next/navigation"
import { FormEditor } from "./form-editor"
import type { BrandData } from "@/lib/types"

async function getBrandData(slug: string) {
  const supabase = createClient()
  const { data: brand, error } = await supabase
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
    .single()

  if (error || !brand) {
    console.error(`Error fetching brand for editor: ${slug}`, error?.message)
    notFound()
  }

  // Ensure sections and items are sorted by position
  const sortedSections = brand.sections.sort((a, b) => a.position - b.position)
  sortedSections.forEach((section) => {
    section.items.sort((a, b) => a.position - b.position)
  })

  return { ...brand, sections: sortedSections } as BrandData
}

export default async function EditorPage({ params }: { params: { brandSlug: string } }) {
  const brandData = await getBrandData(params.brandSlug)

  return <FormEditor initialBrandData={brandData} />
}
