import { createAdminClient } from "@/utils/supabase/server"
import { notFound } from "next/navigation"
import { FormEditor } from "./form-editor"
import type { BrandWithSections } from "@/lib/types"

async function getBrandForEditor(slug: string): Promise<BrandWithSections> {
  const supabase = createAdminClient()
  const { data: brand, error: brandError } = await supabase
    .from("brands")
    .select("*, sections(*, items(*, options(*)))")
    .eq("slug", slug)
    .single()

  if (brandError || !brand) {
    console.error("Error loading editor data:", brandError?.message)
    notFound()
  }

  // Sort sections and items by position
  brand.sections.sort((a, b) => a.position - b.position)
  brand.sections.forEach((section) => {
    section.items.sort((a, b) => a.position - b.position)
  })

  return brand
}

export default async function EditorPage({
  params,
}: {
  params: { brandSlug: string }
}) {
  const brandData = await getBrandForEditor(params.brandSlug)
  return <FormEditor initialBrandData={brandData} />
}
