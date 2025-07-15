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

  const { data: brand, error } = await supabase
    .from("brands")
    .select(
      `
      *,
      clinic_locations (*),
      sections (
        *,
        items (
          *,
          options (*)
        )
      )
    `,
    )
    .eq("slug", params.brandSlug)
    .single<BrandData>()

  if (error || !brand) {
    console.error("Error fetching brand for editor:", error?.message)
    notFound()
  }

  // Ensure sections and items are sorted for the editor
  brand.sections.sort((a, b) => a.position - b.position)
  brand.sections.forEach((section) => {
    section.items.sort((a, b) => a.position - b.position)
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
          <FormEditor brand={brand} />
        </div>
      </main>
    </div>
  )
}
