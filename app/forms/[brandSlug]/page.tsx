import { notFound } from "next/navigation"
import Image from "next/image"
import { createClient } from "@/utils/supabase/server"
import { ClientForm } from "./client-form"
import type { ClientFormParams, Brand, Section, Item, Option } from "@/lib/types"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Terminal } from "lucide-react"

export const revalidate = 0

export default async function FormPage({ params }: { params: { brandSlug: string } }) {
  const supabase = createClient()
  const { brandSlug } = params

  // Step 1: Fetch the brand
  const { data: brand, error: brandError } = await supabase
    .from("brands")
    .select("id, name, slug, description, logo_url, active")
    .eq("slug", brandSlug)
    .single<Brand>()

  if (brandError || !brand) {
    console.error(`Data Error: Brand with slug "${brandSlug}" not found.`, brandError)
    notFound()
  }

  if (!brand.active) {
    return (
      <div className="container mx-auto flex min-h-screen items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-lg">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Form Unavailable</AlertTitle>
          <AlertDescription>
            The order form for "{brand.name}" is not currently active. Please contact an administrator.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // Step 2: Fetch clinic locations
  const { data: locations, error: locationsError } = await supabase
    .from("clinic_locations")
    .select("id, name, address")
    .eq("brand_id", brand.id)

  if (locationsError) {
    console.error(`Data Error: Could not fetch locations for brand "${brand.name}".`, locationsError)
    // Render an error state instead of crashing
    return <div>Error loading clinic locations. Please check the connection and try again.</div>
  }

  // Step 3: Fetch all sections, items, and options in one go
  const { data: sectionsWithItems, error: sectionsError } = await supabase
    .from("sections")
    .select("*, items(*, options(*))")
    .eq("brand_id", brand.id)
    .order("position", { ascending: true })
    .order("position", { foreignTable: "items", ascending: true })

  if (sectionsError) {
    console.error(`Data Error: Could not fetch sections for brand "${brand.name}".`, sectionsError)
    return <div>Error loading form content. Please check the connection and try again.</div>
  }

  // Step 4: Assemble the final, clean props object for the client
  const clientFormParams: ClientFormParams = {
    brandSlug: brand.slug,
    locationOptions: (locations || []).map((loc) => ({
      value: String(loc.id),
      // Defensive mapping to prevent nulls from creating issues
      label: `${loc.name || "Unnamed Location"} - ${loc.address || "No address"}`,
    })),
    // Ensure nested arrays are not null
    sections: (sectionsWithItems || []).map((section) => ({
      ...(section as Section),
      items: (section.items || []).map((item: any) => ({
        ...(item as Item),
        options: (item.options || []) as Option[],
      })),
    })),
  }

  // Step 5: Serialize the clean data to a string to prevent hydration errors
  const serializedData = JSON.stringify(clientFormParams)

  return (
    <div className="container mx-auto p-4 md:p-8">
      <header className="mb-8 flex flex-col items-center text-center">
        {brand.logo_url && (
          <Image
            src={brand.logo_url || "/placeholder.svg"}
            alt={`${brand.name} Logo`}
            width={200}
            height={100}
            className="mb-4 h-auto w-auto max-h-24 object-contain"
            priority
          />
        )}
        <h1 className="text-4xl font-bold">{brand.name} Order Form</h1>
        {brand.description && <p className="mt-2 text-lg text-muted-foreground">{brand.description}</p>}
      </header>
      <main>
        <ClientForm data={serializedData} />
      </main>
    </div>
  )
}
