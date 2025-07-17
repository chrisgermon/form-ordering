import { notFound } from "next/navigation"
import Image from "next/image"
import { createClient } from "@/utils/supabase/server"
import { ClientForm } from "./client-form"
import type { ClientFormParams } from "@/lib/types"

export const revalidate = 0

export default async function FormPage({ params }: { params: { brandSlug: string } }) {
  const supabase = createClient()
  const { brandSlug } = params

  console.log(`Fetching data for brand: ${brandSlug}`)

  const { data: brandData, error: brandError } = await supabase
    .from("brands")
    .select("id, name, slug, description, logo_url")
    .eq("slug", brandSlug)
    .single()

  if (brandError || !brandData) {
    console.error(`Error fetching brand '${brandSlug}':`, brandError?.message)
    notFound()
  }
  console.log("Successfully fetched brand:", brandData.name)

  const { data: locationsData, error: locationsError } = await supabase
    .from("clinic_locations")
    .select("id, name, address")
    .eq("brand_id", brandData.id)

  if (locationsError) {
    console.error(`Error fetching locations for brand '${brandSlug}':`, locationsError.message)
    return <div>Error loading clinic locations. Please try again later.</div>
  }
  console.log(`Successfully fetched ${locationsData.length} locations.`)

  const { data: sectionsData, error: sectionsError } = await supabase
    .from("sections")
    .select("*, items(*, options(*))")
    .eq("brand_id", brandData.id)
    .order("position", { ascending: true })
    .order("position", { foreignTable: "items", ascending: true })

  if (sectionsError) {
    console.error(`Error fetching sections for brand '${brandSlug}':`, sectionsError.message)
    return <div>Error loading form sections. Please try again later.</div>
  }
  console.log(`Successfully fetched ${sectionsData.length} sections.`)

  const clientFormParams: ClientFormParams = {
    brandSlug: brandData.slug,
    locationOptions: locationsData.map((loc) => ({
      value: loc.id,
      label: `${loc.name} - ${loc.address || "Address not available"}`,
    })),
    sections: sectionsData.map((section) => ({
      ...section,
      items: section.items.map((item) => ({
        ...item,
        options: item.options || [],
      })),
    })),
  }

  console.log("Prepared client form params. Serializing data...")
  const serializedData = JSON.stringify(clientFormParams)
  console.log("Data serialized. Rendering page.")

  return (
    <div className="container mx-auto p-4 md:p-8">
      <header className="mb-8 flex flex-col items-center text-center">
        {brandData.logo_url && (
          <Image
            src={brandData.logo_url || "/placeholder.svg"}
            alt={`${brandData.name} Logo`}
            width={200}
            height={100}
            className="mb-4 h-auto w-auto max-h-24 object-contain"
            priority
          />
        )}
        <h1 className="text-4xl font-bold">{brandData.name} Order Form</h1>
        {brandData.description && <p className="mt-2 text-lg text-muted-foreground">{brandData.description}</p>}
      </header>
      <main>
        <ClientForm data={serializedData} />
      </main>
    </div>
  )
}
