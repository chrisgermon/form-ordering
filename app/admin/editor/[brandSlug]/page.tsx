import { createClient } from "@/utils/supabase/server"
import FormEditor from "./form-editor"
import type { BrandWithSections } from "@/lib/types"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Terminal } from "lucide-react"

async function getBrandForEditor(slug: string): Promise<{ data: BrandWithSections | null; error: string | null }> {
  const supabase = createClient()
  const { data: brandData, error: brandError } = await supabase
    .from("brands")
    .select(
      `
      id,
      name,
      slug,
      logo,
      is_active,
      sections (
        id,
        title,
        "order",
        items (
          id,
          label,
          type,
          options,
          is_required,
          "order"
        )
      )
    `,
    )
    .eq("slug", slug)
    .single()

  if (brandError || !brandData) {
    console.error("Error fetching brand for editor:", brandError?.message)
    return { data: null, error: `Could not find a brand with slug "${slug}". Please check the URL.` }
  }

  // Sort sections and items by their order
  const sortedSections = brandData.sections.sort((a, b) => a.order - b.order)
  const sortedBrandData = {
    ...brandData,
    sections: sortedSections.map((section) => ({
      ...section,
      items: section.items.sort((a, b) => a.order - b.order),
    })),
  }

  return { data: sortedBrandData, error: null }
}

export default async function FormEditorPage({ params }: { params: { brandSlug: string } }) {
  const { data: brand, error } = await getBrandForEditor(params.brandSlug)

  if (error || !brand) {
    return (
      <div className="flex items-center justify-center h-screen p-4">
        <Alert variant="destructive" className="max-w-lg">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Error Loading Editor</AlertTitle>
          <AlertDescription>{error || "An unexpected error occurred."}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return <FormEditor brand={brand} />
}
