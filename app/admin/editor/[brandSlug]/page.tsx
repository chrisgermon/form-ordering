import { createClient } from "@/lib/supabase/server"
import { checkUserPermissions } from "@/lib/utils"
import FormEditor from "./form-editor"
import type { BrandWithSections } from "@/lib/types"
import { notFound } from "next/navigation"

export default async function BrandEditorPage({ params }: { params: { brandSlug: string } }) {
  const supabase = createClient()
  await checkUserPermissions(supabase)

  const { data: brand, error } = await supabase
    .from("brands")
    .select(
      `
      *,
      sections (
        *,
        items (
          *
        )
      )
    `,
    )
    .eq("slug", params.brandSlug)
    .order("order", { foreignTable: "sections" })
    .order("order", { foreignTable: "sections.items" })
    .single()

  if (error || !brand) {
    console.error("Error fetching brand for editor:", error)
    notFound()
  }

  return <FormEditor brand={brand as BrandWithSections} />
}
