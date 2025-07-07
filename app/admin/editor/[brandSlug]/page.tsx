import { createAdminClient } from "@/lib/supabase/admin"
import { notFound } from "next/navigation"
import { FormEditor } from "./form-editor"
import type { BrandData } from "@/lib/types"

export default async function FormEditorPage({ params }: { params: { brandSlug: string } }) {
  const supabase = createAdminClient()

  const { data: brand, error: brandError } = await supabase
    .from("brands")
    .select(
      `
      *,
      product_sections:product_sections(*)
    `,
    )
    .eq("slug", params.brandSlug)
    .single()

  if (brandError || !brand) {
    console.error("Error fetching brand:", brandError)
    notFound()
  }

  // Fetch files specific to this brand
  const { data: files, error: filesError } = await supabase
    .from("files")
    .select("*")
    .eq("brand_id", brand.id)
    .order("created_at", { ascending: false })

  if (filesError) {
    console.error("Error fetching files:", filesError)
    // We can still render the page, just with an empty files list
  }

  const initialBrandData: BrandData = {
    ...brand,
    product_sections: brand.product_sections || [],
  }

  return <FormEditor initialBrandData={initialBrandData} uploadedFiles={files || []} />
}
