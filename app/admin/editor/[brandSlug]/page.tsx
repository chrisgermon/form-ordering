import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Terminal } from "lucide-react"
import type { BrandData, Item, Section } from "@/lib/types"
import FormEditor from "./form-editor"
import { createAdminClient } from "@/utils/supabase/server"
import { notFound } from "next/navigation"

export default async function FormEditorPage({ params }: { params: { brandSlug: string } }) {
  const supabase = createAdminClient()

  // Step 1: Fetch the core brand data.
  const { data: brand, error: brandError } = await supabase
    .from("brands")
    .select("*")
    .eq("slug", params.brandSlug)
    .single()

  if (brandError) {
    console.error("Error fetching brand data for editor:", brandError)
    return (
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <Alert variant="destructive">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Database Error</AlertTitle>
          <AlertDescription>
            <p>Could not fetch the primary brand data.</p>
            <p className="mt-2 font-mono text-xs">{brandError.message}</p>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!brand) {
    notFound()
  }

  // Step 2: Fetch all related data in separate, simple queries.
  const [locationsResult, sectionsResult] = await Promise.all([
    supabase.from("clinic_locations").select("*").eq("brand_id", brand.id),
    supabase.from("sections").select("*").eq("brand_id", brand.id).order("position"),
  ])

  const { data: clinicLocations, error: locationsError } = locationsResult
  const { data: sections, error: sectionsError } = sectionsResult

  if (locationsError) console.error("Error fetching clinic locations:", locationsError)
  if (sectionsError) console.error("Error fetching sections:", sectionsError)

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

  // Step 4: Assemble the final BrandData object.
  const brandData: BrandData = {
    ...brand,
    clinic_locations: clinicLocations || [],
    sections: sectionsWithItems,
  }

  return <FormEditor initialBrand={brandData} />
}
