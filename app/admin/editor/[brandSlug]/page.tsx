import { createClient } from "@/utils/supabase/server"
import { notFound } from "next/navigation"
import FormEditor from "./form-editor"
import type { BrandData, Item, Section } from "@/lib/types"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Terminal } from "lucide-react"
import Link from "next/link"

async function getBrandDataForEditor(slug: string): Promise<BrandData | null> {
  const supabase = createClient()
  let brandId: string | null = null
  let relationshipError = ""

  try {
    // Step 1: Fetch the core brand data.
    const { data: brand, error: brandError } = await supabase
      .from("brands")
      .select("id, name, slug, logo, emails, active")
      .eq("slug", slug)
      .single()

    if (brandError) {
      if (brandError.message.includes("relationship")) {
        relationshipError = brandError.message
        // Try to fetch just the brand ID to continue
        const { data: brandOnly } = await supabase.from("brands").select("id").eq("slug", slug).single()
        if (brandOnly) brandId = brandOnly.id
      } else {
        throw brandError
      }
    }

    if (!brand && !brandId) {
      console.error(`Editor: Brand with slug ${slug} not found.`)
      return null
    }

    const finalBrandId = brand?.id || brandId
    if (!finalBrandId) {
      console.error(`Editor: Could not determine brand ID for slug ${slug}.`)
      return null
    }

    // Step 2: Fetch all related data in parallel.
    const [locationsResult, sectionsResult] = await Promise.all([
      supabase.from("clinic_locations").select("*").eq("brand_id", finalBrandId),
      supabase.from("sections").select("*").eq("brand_id", finalBrandId).order("position"),
    ])

    const { data: clinicLocations, error: locationsError } = locationsResult
    const { data: sections, error: sectionsError } = sectionsResult

    if (locationsError?.message.includes("relationship")) relationshipError = locationsError.message
    if (sectionsError?.message.includes("relationship")) relationshipError = sectionsError.message

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
      ...(brand || { id: finalBrandId, slug, name: "Unknown", logo: null, emails: [], active: false }),
      clinic_locations: clinicLocations || [],
      sections: sectionsWithItems,
    }

    if (relationshipError) {
      // Attach the error to the returned data so the UI can display it
      ;(fullBrandData as any).relationshipError = relationshipError
    }

    return fullBrandData
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    console.error(`Failed to get brand data for editor (${slug}):`, errorMessage)
    if (errorMessage.includes("relationship")) {
      return {
        id: "",
        name: "Error",
        slug: slug,
        logo: null,
        emails: [],
        active: false,
        clinic_locations: [],
        sections: [],
        relationshipError: errorMessage,
      } as any
    }
    return null
  }
}

export default async function FormEditorPage({ params }: { params: { brandSlug: string } }) {
  const brandData = await getBrandDataForEditor(params.brandSlug)

  if (!brandData) {
    notFound()
  }

  const relationshipError = (brandData as any).relationshipError

  return (
    <div className="flex flex-col h-screen">
      {relationshipError && (
        <Alert variant="destructive" className="m-4">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Database Relationship Error</AlertTitle>
          <AlertDescription>
            <p>
              Could not fetch the full brand data. This usually means a database relationship is missing or
              misconfigured.
            </p>
            <p className="font-mono text-xs bg-red-900/20 p-2 rounded-md my-2">{relationshipError}</p>
            <p>
              Please go to your{" "}
              <Link
                href={`https://supabase.com/dashboard/project/${process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID}/sql/new`}
                target="_blank"
                className="underline"
              >
                Supabase SQL Editor
              </Link>{" "}
              and run the latest schema correction script to fix this.
            </p>
          </AlertDescription>
        </Alert>
      )}
      <FormEditor initialBrand={brandData} />
    </div>
  )
}
