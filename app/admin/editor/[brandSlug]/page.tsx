import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Terminal } from "lucide-react"
import type { BrandData } from "@/lib/types"
import FormEditor from "./form-editor"
import { createAdminClient } from "@/utils/supabase/server"
import { notFound } from "next/navigation"

export default async function FormEditorPage({ params }: { params: { brandSlug: string } }) {
  const supabase = createAdminClient()

  // Step 1: Fetch the core brand data without the problematic nested relation.
  const { data: brandBase, error: brandError } = await supabase
    .from("brands")
    .select(
      `
      *,
      sections(
        *,
        items(
          *,
          options(*)
        )
      )
    `,
    )
    .eq("slug", params.brandSlug)
    .order("position", { foreignTable: "sections" })
    .order("position", { foreignTable: "sections.items" })
    .order("sort_order", { foreignTable: "sections.items.options" })
    .single()

  if (brandError) {
    console.error("Error fetching base brand data for editor:", brandError)
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

  if (!brandBase) {
    notFound()
  }

  // Step 2: Fetch the clinic locations in a separate, simple query.
  const { data: clinicLocations, error: locationsError } = await supabase
    .from("clinic_locations")
    .select("*")
    .eq("brand_id", brandBase.id)

  if (locationsError) {
    // Log the error but don't block the page from rendering.
    // The user can still edit the rest of the form.
    console.error("Error fetching clinic locations:", locationsError)
  }

  // Step 3: Combine the data into the final object for the editor component.
  const brand: BrandData = {
    ...brandBase,
    clinic_locations: clinicLocations || [],
  }

  return <FormEditor initialBrand={brand} />
}
