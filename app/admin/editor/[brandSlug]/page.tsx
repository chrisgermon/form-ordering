import { createServerSupabaseClient } from "@/lib/supabase"
import { notFound } from "next/navigation"
import { FormEditor } from "./form-editor"
import type { Brand, ProductSection } from "@/lib/types"

type EditorPageProps = {
  params: {
    brandSlug: string
  }
}

export default async function EditorPage({ params }: EditorPageProps) {
  const supabase = createServerSupabaseClient()
  const { brandSlug } = params

  let brandData: (Brand & { product_sections: ProductSection[] }) | null = null

  if (brandSlug !== "new") {
    const { data, error } = await supabase
      .from("brands")
      .select(
        `
        *,
        product_sections (
          *,
          items (*)
        )
      `,
      )
      .eq("slug", brandSlug)
      .single()

    if (error) {
      console.error("Error fetching brand for editor:", error)
      notFound()
    }
    brandData = data as any
  }

  return (
    <main className="container mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold mb-6">{brandData ? `Editing: ${brandData.name}` : "Create New Brand"}</h1>
      <FormEditor brand={brandData} />
    </main>
  )
}
