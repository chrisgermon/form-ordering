import { createClient } from "@/utils/supabase/server"
import { notFound } from "next/navigation"
import FormEditor from "./form-editor"
import type { BrandData, Item, Section } from "@/lib/types"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Terminal } from "lucide-react"
import Link from "next/link"

async function getBrandData(slug: string): Promise<BrandData | { error: string }> {
  const supabase = createClient()
  try {
    // Step 1: Fetch the core brand data.
    const { data: brand, error: brandError } = await supabase
      .from("brands")
      .select("id, name, slug, logo, emails, active")
      .eq("slug", slug)
      .single()

    if (brandError) throw brandError
    if (!brand) {
      notFound()
    }

    // Step 2: Fetch all related data in parallel.
    const [locationsResult, sectionsResult] = await Promise.all([
      supabase.from("clinic_locations").select("*").eq("brand_id", brand.id),
      supabase.from("sections").select("*").eq("brand_id", brand.id).order("position"),
    ])

    const { data: clinicLocations, error: locationsError } = locationsResult
    const { data: sections, error: sectionsError } = sectionsResult

    if (locationsError) console.error(`Error fetching clinic locations for brand ${slug}:`, locationsError)
    if (sectionsError) throw new Error("Could not fetch sections. Check database relationships.")

    // Step 3: For each section, fetch its items and their options.
    const sectionsWithItems = await Promise.all(
      (sections || []).map(async (section: Section) => {
        const { data: items, error: itemsError } = await supabase
          .from("items")
          .select("*")
          .eq("section_id", section.id)
          .order("position")

        if (itemsError) console.error(`Error fetching items for section ${section.id}:`, itemsError)

        const itemsWithOptions = await Promise.all(
          (items || []).map(async (item: Item) => {
            const { data: options, error: optionsError } = await supabase
              .from("options")
              .select("*")
              .eq("item_id", item.id)
              .order("sort_order")

            if (optionsError) console.error(`Error fetching options for item ${item.id}:`, optionsError)

            return { ...item, options: options || [] }
          }),
        )
        return { ...section, items: itemsWithOptions }
      }),
    )

    // Step 4: Assemble and return the final object.
    const fullBrandData: BrandData = {
      ...brand,
      clinic_locations: clinicLocations || [],
      sections: sectionsWithItems,
    }

    return fullBrandData
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    console.error(`Error in getBrandData for slug ${slug}:`, errorMessage)
    if (errorMessage.includes("relationship")) {
      return { error: `Database Error: ${errorMessage}` }
    }
    notFound()
  }
}

export default async function FormEditorPage({ params }: { params: { brandSlug: string } }) {
  const brandData = await getBrandData(params.brandSlug)

  if ("error" in brandData) {
    return (
      <div className="container mx-auto p-8">
        <Alert variant="destructive">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Error Loading Form Editor</AlertTitle>
          <AlertDescription>
            <p className="mb-2">{brandData.error}</p>
            <p>
              This usually indicates a problem with the database schema relationships. Please ensure your database
              schema is up to date. You may need to run the latest migration script in your Supabase SQL Editor.
            </p>
            <Link href={`/admin`} className="font-bold underline mt-2 inline-block">
              Return to Admin Dashboard
            </Link>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return <FormEditor brand={brandData} />
}
