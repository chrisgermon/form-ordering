import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import FormEditor from "./form-editor"
import { checkUserPermissions } from "@/lib/auth"
import { list } from "@vercel/blob"

export default async function FormEditorPage({ params }: { params: { brandSlug: string } }) {
  await checkUserPermissions()

  const supabase = createClient()
  const { data: brand, error } = await supabase
    .from("brands")
    .select(
      `
      *,
      product_sections (
        *,
        product_items (*)
      )
    `,
    )
    .eq("slug", params.brandSlug)
    .single()

  if (error || !brand) {
    notFound()
  }

  const { blobs } = await list()

  return <FormEditor initialBrandData={brand} uploadedFiles={blobs} />
}
