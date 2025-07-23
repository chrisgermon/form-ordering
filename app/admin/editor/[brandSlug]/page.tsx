import { createClient } from "@/utils/supabase/server"
import { notFound } from "next/navigation"
import FormEditor from "./form-editor"

export default async function FormEditorPage({ params }: { params: { brandSlug: string } }) {
  const supabase = createClient()

  const { data: brand, error } = await supabase
    .from("brands")
    .select(
      `
      *,
      sections:sections(
        *,
        items:items(*)
      )
    `,
    )
    .eq("slug", params.brandSlug)
    .order("sort_order", { foreignTable: "sections", ascending: true })
    .order("sort_order", { foreignTable: "sections.items", ascending: true })
    .single()

  if (error || !brand) {
    console.error("Error fetching brand for editor:", error)
    notFound()
  }

  return <FormEditor brand={brand} />
}
