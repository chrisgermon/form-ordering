import { createServerSupabaseClient } from "@/lib/supabase"
import { notFound } from "next/navigation"
import { FormEditor } from "./form-editor"
import type { Brand, ProductSection, ProductItem, UploadedFile } from "@/lib/types"

export type SectionWithItems = ProductSection & {
  product_items: ProductItem[]
}

async function getBrandData(slug: string): Promise<{ brand: Brand | null; sections: SectionWithItems[] }> {
  const supabase = createServerSupabaseClient()

  if (slug === "new") {
    return { brand: null, sections: [] }
  }

  const { data: brand, error: brandError } = await supabase.from("brands").select("*").eq("slug", slug).single()

  if (brandError || !brand) {
    console.error(`Error fetching brand '${slug}':`, brandError)
    return { brand: null, sections: [] }
  }

  const { data: sections, error: sectionsError } = await supabase
    .from("product_sections")
    .select("*, product_items(*)")
    .eq("brand_id", brand.id)
    .order("sort_order", { ascending: true })
    .order("sort_order", { foreignTable: "product_items", ascending: true })

  if (sectionsError) {
    console.error(`Error fetching sections for brand '${slug}':`, sectionsError)
  }

  return { brand, sections: (sections as SectionWithItems[]) || [] }
}

async function getUploadedFiles(): Promise<UploadedFile[]> {
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase.from("uploaded_files").select("*").order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching uploaded files:", error)
    return []
  }
  return data as UploadedFile[]
}

export default async function FormEditorPage({ params }: { params: { brandSlug: string } }) {
  const { brand, sections } = await getBrandData(params.brandSlug)
  const uploadedFiles = await getUploadedFiles()

  if (!brand && params.brandSlug !== "new") {
    notFound()
  }

  return (
    <main className="container mx-auto p-4 md:p-8">
      <FormEditor initialBrand={brand} initialSections={sections} uploadedFiles={uploadedFiles} />
    </main>
  )
}
