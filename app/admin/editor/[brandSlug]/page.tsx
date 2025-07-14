import { createServerSupabaseClient } from "@/lib/supabase"
import { FormEditor } from "./form-editor"
import { notFound } from "next/navigation"
import type { Brand, UploadedFile } from "@/lib/types"

interface PageProps {
  params: {
    brandSlug: string
  }
}

export default async function EditorPage({ params }: PageProps) {
  const supabase = createServerSupabaseClient()

  // Fetch the brand data with nested sections and items
  const { data, error: brandError } = await supabase
    .from("brands")
    .select(
      `
        id, name, slug, logo, primary_color, email, active,
        product_sections (
          id, title, sort_order, brand_id,
          product_items (
            id, code, name, description, quantities, sample_link, sort_order, section_id, brand_id
          )
        )
      `,
    )
    .eq("slug", params.brandSlug)
    .order("sort_order", { foreignTable: "product_sections", ascending: true })
    .order("sort_order", { foreignTable: "product_sections.product_items", ascending: true })
    .limit(1) // Use limit(1) instead of single()

  if (brandError) {
    console.error("Error fetching brand data:", brandError)
    notFound()
  }

  if (!data || data.length === 0) {
    notFound()
  }

  const brandData = data[0]

  // Fetch uploaded files
  const { data: uploadedFiles, error: filesError } = await supabase
    .from("uploaded_files")
    .select("*")
    .order("uploaded_at", { ascending: false })

  if (filesError) {
    console.error("Error fetching uploaded files:", filesError)
    // We can still render the page, but file selection will be empty.
  }

  return <FormEditor initialBrandData={brandData as Brand} uploadedFiles={(uploadedFiles as UploadedFile[]) || []} />
}
