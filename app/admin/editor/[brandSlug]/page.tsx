import { createServerSupabaseClient } from "@/lib/supabase"
import { notFound } from "next/navigation"
import { FormEditor } from "./form-editor"
import type { Brand, ProductSection, ProductItem } from "@/lib/types"

type EditorPageProps = {
  params: { brandSlug: string }
}

export type BrandForEditor = Brand & {
  product_sections: (ProductSection & {
    product_items: ProductItem[]
  })[]
}

async function getBrandForEditor(slug: string): Promise<BrandForEditor | null> {
  if (slug === "new") {
    return {
      id: "",
      name: "",
      slug: "",
      logo: null,
      primary_color: null,
      email: "",
      active: true,
      created_at: "",
      updated_at: "",
      clinics: [],
      product_sections: [],
    }
  }

  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
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
    .eq("slug", slug)
    .order("sort_order", { foreignTable: "product_sections", ascending: true })
    .order("sort_order", { foreignTable: "product_sections.product_items", ascending: true })
    .single()

  if (error) {
    console.error(`Error fetching brand '${slug}':`, error)
    return null
  }

  return data
}

export default async function BrandEditorPage({ params }: EditorPageProps) {
  const brand = await getBrandForEditor(params.brandSlug)

  if (!brand) {
    notFound()
  }

  return <FormEditor initialData={brand} />
}
