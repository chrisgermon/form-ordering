import { createClient } from "@/utils/supabase/server"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Eye } from "lucide-react"
import { FormEditor } from "./form-editor"
import type { BrandData } from "@/lib/types"

export const revalidate = 0

export default async function BrandEditorPage({ params }: { params: { brandSlug: string } }) {
  const supabase = createClient()

  // Step 1: Fetch the brand and its direct relations
  const { data: brand, error: brandError } = await supabase
    .from("brands")
    .select(`*, clinic_locations (*)`)
    .eq("slug", params.brandSlug)
    .single()

  if (brandError || !brand) {
    console.error("Error fetching brand:", brandError?.message)
    notFound()
  }

  // Step 2: Fetch the sections and their nested items/options for that brand
  const { data: sections, error: sectionsError } = await supabase
    .from("sections")
    .select(
      `
      *,
      items (
        *,
        options (*)
      )
    `,
    )
    .eq("brand_id", brand.id)
    .order("position", { ascending: true })

  if (sectionsError) {
    console.error("Error fetching sections for editor:", sectionsError.message)
    // Assign empty array to prevent crash, page will show "no sections"
    brand.sections = []
  } else {
    brand.sections = sections || []
  }

  // Ensure items within each section are sorted by position
  brand.sections.forEach((section) => {
    if (section.items) {
      section.items.sort((a, b) => a.position - b.position)
    }
  })

  return (
    <div className="flex flex-col h-full bg-muted/40">
      <header className="bg-background border-b p-4 flex items-center justify-between sticky top-0 z-10">
        <div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Brands
            </Link>
          </Button>
        </div>
        <h1 className="text-xl font-semibold text-center">
          Editing: <span className="font-bold">{brand.name}</span>
        </h1>
        <div>
          <Button variant="outline" size="sm" asChild>
            <a href={`/forms/${brand.slug}`} target="_blank" rel="noopener noreferrer">
              <Eye className="h-4 w-4 mr-2" />
              Preview Form
            </a>
          </Button>
        </div>
      </header>
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <div className="max-w-5xl mx-auto">
          <FormEditor brand={brand as BrandData} />
        </div>
      </main>
    </div>
  )
}
