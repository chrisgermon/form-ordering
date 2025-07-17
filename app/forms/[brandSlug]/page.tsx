import { createClient } from "@/utils/supabase/server"
import { notFound } from "next/navigation"
import { ClientForm } from "./form" // Corrected import path
import type { Brand, ClinicLocation, ProductSection, ProductItem, Option } from "@/lib/types"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"
import Image from "next/image"

export const revalidate = 3600 // revalidate at most every hour

type FullBrandData = Brand & {
  clinic_locations: ClinicLocation[]
  product_sections: (ProductSection & {
    product_items: (ProductItem & {
      options: Option[]
    })[]
  })[]
}

async function getBrandData(slug: string): Promise<{ data: FullBrandData | null; error: string | null }> {
  const supabase = createClient()

  // 1. Fetch the brand by slug
  const { data: brand, error: brandError } = await supabase.from("brands").select("*").eq("slug", slug).single()

  if (brandError || !brand) {
    console.error(`Error fetching brand with slug ${slug}:`, brandError)
    return { data: null, error: "Brand not found." }
  }

  if (!brand.is_active) {
    return { data: null, error: "This form is currently unavailable." }
  }

  // 2. Fetch clinic locations for the brand
  const { data: locations, error: locationsError } = await supabase
    .from("clinic_locations")
    .select("*")
    .eq("brand_id", brand.id)

  if (locationsError) {
    console.error(`Error fetching locations for brand ${brand.id}:`, locationsError)
    return { data: null, error: "Could not fetch clinic locations." }
  }

  // 3. Fetch sections for the brand
  const { data: sections, error: sectionsError } = await supabase
    .from("product_sections")
    .select("*")
    .eq("brand_id", brand.id)
    .order("order", { ascending: true })

  if (sectionsError) {
    console.error(`Error fetching sections for brand ${brand.id}:`, sectionsError)
    return { data: null, error: "Could not fetch form sections." }
  }

  // 4. Fetch items for each section
  const sectionsWithItems = await Promise.all(
    sections.map(async (section) => {
      const { data: items, error: itemsError } = await supabase
        .from("product_items")
        .select("*")
        .eq("section_id", section.id)
        .order("order", { ascending: true })

      if (itemsError) {
        console.error(`Error fetching items for section ${section.id}:`, itemsError)
        throw new Error("Could not fetch form items.")
      }

      // 5. Fetch options for each item
      const itemsWithOptions = await Promise.all(
        items.map(async (item) => {
          const { data: options, error: optionsError } = await supabase
            .from("options")
            .select("*")
            .eq("item_id", item.id)
            .order("id", { ascending: true })

          if (optionsError) {
            console.error(`Error fetching options for item ${item.id}:`, optionsError)
            throw new Error("Could not fetch item options.")
          }
          return { ...item, options: options || [] }
        }),
      )
      return { ...section, product_items: itemsWithOptions }
    }),
  )

  const fullData: FullBrandData = {
    ...brand,
    clinic_locations: locations || [],
    product_sections: sectionsWithItems,
  }

  return { data: fullData, error: null }
}

export default async function BrandFormPage({ params }: { params: { brandSlug: string } }) {
  const { data: brandData, error } = await getBrandData(params.brandSlug)

  if (error === "Brand not found.") {
    notFound()
  }

  if (error || !brandData) {
    return (
      <div className="container mx-auto flex min-h-screen items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-lg">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error Loading Form</AlertTitle>
          <AlertDescription>{error || "An unexpected error occurred. Please try again later."}</AlertDescription>
        </Alert>
      </div>
    )
  }

  const locationOptions = brandData.clinic_locations.map((loc) => ({
    value: loc.id,
    label: `${loc.name} - ${loc.address}`,
  }))

  const sections = brandData.product_sections.map((s) => ({
    id: s.id,
    title: s.title,
    items: s.product_items.map((i) => ({
      id: i.id,
      name: i.name,
      description: i.description,
      field_type: i.field_type,
      is_required: i.is_required,
      placeholder: i.placeholder,
      options: i.options.map((o) => ({
        id: o.id,
        value: o.value,
        label: o.label,
      })),
    })),
  }))

  return (
    <div className="container mx-auto max-w-4xl p-4 sm:p-6 lg:p-8">
      <div className="mb-8 flex flex-col items-center text-center">
        {brandData.logo && (
          <Image
            src={brandData.logo || "/placeholder.svg"}
            alt={`${brandData.name} Logo`}
            width={200}
            height={100}
            className="mb-4 h-auto w-auto max-h-24 object-contain"
          />
        )}
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{brandData.name} Order Form</h1>
        {brandData.description && <p className="mt-2 text-lg text-muted-foreground">{brandData.description}</p>}
      </div>
      <ClientForm brandSlug={brandData.slug} locationOptions={locationOptions} sections={sections} />
    </div>
  )
}
