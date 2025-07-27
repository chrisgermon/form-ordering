import { createClient } from "@/lib/supabase/server"
import FormEditor from "./form-editor"
import { checkUserPermissions } from "@/lib/auth"
import { notFound } from "next/navigation"

export default async function FormEditorPage({ params }: { params: { brandSlug: string } }) {
  await checkUserPermissions()

  const supabase = createClient()

  const { data: brand, error: brandError } = await supabase
    .from("brands")
    .select(
      `
      *,
      product_sections (
        *,
        product_items (
          *
        )
      )
    `,
    )
    .eq("slug", params.brandSlug)
    .single()

  if (brandError || !brand) {
    console.error("Error fetching brand:", brandError)
    notFound()
  }

  const { data: uploadedFiles, error: filesError } = await supabase.storage.from("files").list(brand.slug, {
    limit: 100,
  })

  if (filesError) {
    console.error("Error fetching files:", filesError)
  }

  return <FormEditor initialBrandData={brand} uploadedFiles={uploadedFiles || []} />
}
