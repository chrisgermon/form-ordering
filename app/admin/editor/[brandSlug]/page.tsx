import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import FormEditor from "./form-editor"
import type { Brand, UploadedFile } from "@/lib/types"

type Props = {
  params: {
    brandSlug: string
  }
}

export default async function FormEditorPage({ params }: Props) {
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
    console.error("Error fetching brand:", error)
    notFound()
  }

  // Manually sort the nested sections and items to ensure consistent order
  if (brand.product_sections) {
    brand.product_sections.sort((a, b) => a.sort_order - b.sort_order)
    brand.product_sections.forEach((section) => {
      if (section.product_items) {
        section.product_items.sort((a, b) => a.sort_order - b.sort_order)
      }
    })
  }

  const { data: uploadedFiles, error: filesError } = await supabase
    .from("uploaded_files")
    .select("*")
    .eq("brand_id", brand.id)
    .order("created_at", { ascending: false })

  if (filesError) {
    console.error("Error fetching uploaded files:", filesError)
    // We can still render the page with an empty array of files
  }

  return <FormEditor initialBrandData={brand as Brand} uploadedFiles={(uploadedFiles as UploadedFile[]) || []} />
}
