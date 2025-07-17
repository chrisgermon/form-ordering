import { notFound } from "next/navigation"
import Image from "next/image"
import { createClient } from "@/utils/supabase/server"
import { ClientForm } from "./client-form"
import type { ClientFormParams } from "@/lib/types"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Terminal } from "lucide-react"

export const revalidate = 0

export default async function FormPage({ params }: { params: { brandSlug: string } }) {
  const supabase = createClient()
  const { brandSlug } = params

  console.log(`=== FORM PAGE DEBUG: Starting for brand slug: ${brandSlug} ===`)

  // Step 1: Fetch the brand
  const { data: brand, error: brandError } = await supabase
    .from("brands")
    .select("id, name, slug, description, logo, active")
    .eq("slug", brandSlug)
    .single()

  console.log("Brand query result:", { brand, error: brandError })

  if (brandError || !brand) {
    console.error(`Data Error: Brand with slug "${brandSlug}" not found.`, brandError)
    notFound()
  }

  if (!brand.active) {
    console.log("Brand is not active, showing inactive message")
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

  // Step 2: Fetch clinic locations with explicit field selection
  const { data: rawLocations, error: locationsError } = await supabase
    .from("clinic_locations")
    .select("id, name, address")
    .eq("brand_id", brand.id)

  console.log("Raw locations from database:", rawLocations)
  console.log("Locations error:", locationsError)

  if (locationsError) {
    console.error(`Data Error: Could not fetch locations for brand "${brand.name}".`, locationsError)
    return (
      <div className="container mx-auto flex min-h-screen items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-lg">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Database Error</AlertTitle>
          <AlertDescription>
            Error loading clinic locations. Please check the connection and try again.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // Step 3: Process locations with extensive logging and safety checks
  const locationOptions = (rawLocations || []).map((loc, index) => {
    console.log(`Processing location ${index}:`, loc)

    // Ensure all values are strings and handle nulls/undefined
    const id = loc.id ? String(loc.id) : `unknown-${index}`
    const name = loc.name ? String(loc.name) : "Unnamed Location"
    const address = loc.address ? String(loc.address) : "No address"

    const option = {
      value: id,
      label: `${name} - ${address}`,
    }

    console.log(`Created location option ${index}:`, option)
    return option
  })

  console.log("Final locationOptions array:", locationOptions)

  // Step 4: Fetch sections with items and options
  const { data: rawSections, error: sectionsError } = await supabase
    .from("sections")
    .select(`
      id,
      title,
      position,
      brand_id,
      items (
        id,
        code,
        name,
        description,
        field_type,
        placeholder,
        is_required,
        position,
        section_id,
        brand_id,
        options (
          id,
          value,
          label,
          sort_order,
          item_id,
          brand_id
        )
      )
    `)
    .eq("brand_id", brand.id)
    .order("position", { ascending: true })

  console.log("Raw sections from database:", JSON.stringify(rawSections, null, 2))
  console.log("Sections error:", sectionsError)

  if (sectionsError) {
    console.error(`Data Error: Could not fetch sections for brand "${brand.name}".`, sectionsError)
    return (
      <div className="container mx-auto flex min-h-screen items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-lg">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Database Error</AlertTitle>
          <AlertDescription>Error loading form content. Please check the connection and try again.</AlertDescription>
        </Alert>
      </div>
    )
  }

  // Step 5: Process sections with safety checks
  const sections = (rawSections || []).map((section, sectionIndex) => {
    console.log(`Processing section ${sectionIndex}:`, section)

    const processedSection = {
      id: String(section.id),
      title: String(section.title || `Section ${sectionIndex + 1}`),
      position: section.position || sectionIndex,
      brand_id: String(section.brand_id),
      items: (section.items || []).map((item: any, itemIndex: number) => {
        console.log(`Processing item ${itemIndex} in section ${sectionIndex}:`, item)

        const processedItem = {
          id: String(item.id),
          code: String(item.code || ""),
          name: String(item.name || `Item ${itemIndex + 1}`),
          description: item.description ? String(item.description) : null,
          field_type: item.field_type || "text",
          placeholder: item.placeholder ? String(item.placeholder) : null,
          is_required: Boolean(item.is_required),
          position: item.position || itemIndex,
          section_id: String(item.section_id),
          brand_id: String(item.brand_id),
          options: (item.options || []).map((option: any, optionIndex: number) => {
            console.log(`Processing option ${optionIndex} for item ${itemIndex}:`, option)

            return {
              id: String(option.id),
              value: String(option.value),
              label: option.label ? String(option.label) : String(option.value),
              sort_order: option.sort_order || optionIndex,
              item_id: String(option.item_id),
              brand_id: String(option.brand_id),
            }
          }),
        }

        console.log(`Processed item ${itemIndex}:`, processedItem)
        return processedItem
      }),
    }

    console.log(`Processed section ${sectionIndex}:`, processedSection)
    return processedSection
  })

  console.log("Final processed sections:", JSON.stringify(sections, null, 2))

  // Step 6: Create the final client params object
  const clientFormParams: ClientFormParams = {
    brandSlug: String(brand.slug),
    brandName: String(brand.name),
    brandLogo: brand.logo ? String(brand.logo) : null,
    locationOptions: locationOptions,
    sections: sections,
  }

  console.log("Final clientFormParams object:", JSON.stringify(clientFormParams, null, 2))

  // Step 7: Serialize to JSON string
  let serializedData: string
  try {
    serializedData = JSON.stringify(clientFormParams)
    console.log("Successfully serialized data, length:", serializedData.length)
  } catch (serializationError) {
    console.error("CRITICAL: Failed to serialize client form params:", serializationError)
    return (
      <div className="container mx-auto flex min-h-screen items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-lg">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Serialization Error</AlertTitle>
          <AlertDescription>Failed to prepare form data. Please contact support.</AlertDescription>
        </Alert>
      </div>
    )
  }

  console.log("=== FORM PAGE DEBUG: Rendering page ===")

  return (
    <div className="container mx-auto p-4 md:p-8">
      <header className="mb-8 flex flex-col items-center text-center">
        {brand.logo && (
          <Image
            src={brand.logo || "/placeholder.svg"}
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
