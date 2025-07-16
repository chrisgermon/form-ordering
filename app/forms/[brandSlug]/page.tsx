import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Terminal } from "lucide-react"
import { BrandForm } from "./form"
import type { LocationOption, Section, Item, Option, ClientFormParams } from "@/lib/types"
import { createClient } from "@/utils/supabase/server"

export const revalidate = 0

type BrandFetchResult = {
  status: "found" | "inactive" | "not_found"
  data: ClientFormParams | { name: string } | null
}

// This function now uses manual joins and the correct table names to be resilient.
async function getBrandPageData(slug: string): Promise<BrandFetchResult> {
  const supabase = createClient()

  // Step 1: Fetch the core brand data.
  const { data: brand, error: brandError } = await supabase
    .from("brands")
    .select("id, name, slug, logo, emails, active")
    .eq("slug", slug)
    .single()

  if (brandError || !brand) {
    console.error(`Data fetching error for slug "${slug}":`, brandError?.message)
    return { status: "not_found", data: null }
  }

  if (!brand.active) {
    return { status: "inactive", data: { name: brand.name } }
  }

  // Step 2: Fetch related data in parallel using correct table names.
  const [locationsResult, sectionsResult] = await Promise.all([
    supabase.from("clinic_locations").select("*").eq("brand_id", brand.id),
    supabase.from("product_sections").select("*").eq("brand_id", brand.id).order("sort_order"),
  ])

  if (sectionsResult.error) {
    console.error(`Error fetching product_sections for brand ${slug}:`, sectionsResult.error.message)
    return { status: "not_found", data: null } // Can't render a form without sections.
  }

  const clinicLocations = locationsResult.data || []
  const productSections = sectionsResult.data || []

  // Step 3: Fetch items for each section and map to the expected `Section` type.
  const sanitizedSections: Section[] = await Promise.all(
    productSections.map(async (pSection) => {
      const { data: productItems, error: itemsError } = await supabase
        .from("product_items")
        .select("*")
        .eq("section_id", pSection.id)
        .order("sort_order")

      if (itemsError) {
        console.error(`Error fetching items for section ${pSection.id}:`, itemsError.message)
        return null // Skip this section if its items can't be fetched.
      }

      const sanitizedItems: Item[] = (productItems || []).map((pItem) => ({
        ...pItem,
        position: pItem.sort_order, // Map sort_order to position
        field_type: pItem.field_type || "text", // Ensure field_type has a default
        options: (pItem.options as Option[]) || [], // Ensure options is an array
      }))

      return {
        id: pSection.id,
        title: pSection.title,
        position: pSection.sort_order,
        brand_id: pSection.brand_id,
        items: sanitizedItems,
      }
    }),
  ).then((results) => results.filter((s): s is Section => s !== null && s.items.length > 0))

  // Step 4: Assemble the final, clean props object for the client.
  const locationOptions: LocationOption[] = clinicLocations.map((loc) => ({ value: loc.id, label: loc.name }))

  const clientProps: ClientFormParams = {
    brandName: brand.name,
    brandSlug: brand.slug,
    brandLogo: brand.logo,
    locationOptions,
    sections: sanitizedSections,
  }

  return { status: "found", data: clientProps }
}

export default async function BrandFormPage({ params }: { params: { brandSlug: string } }) {
  const { status, data } = await getBrandPageData(params.brandSlug)

  if (status === "not_found") {
    notFound()
  }

  if (status === "inactive") {
    const { name } = data as { name: string }
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-lg">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Form Currently Unavailable</AlertTitle>
          <AlertDescription>
            The order form for "{name}" is not currently active. Please contact the administrator for assistance.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const clientProps = data as ClientFormParams

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4 w-[160px]">
            <Link href="/" className="text-sm text-gray-600 hover:underline">
              ← All Brands
            </Link>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-800 text-center flex-1">
            {clientProps.brandName} Order Form
          </h1>
          <div className="w-[160px] flex justify-end">
            {clientProps.brandLogo && (
              <Image
                src={clientProps.brandLogo || "/placeholder.svg"}
                alt={`${clientProps.brandName} Logo`}
                width={160}
                height={40}
                className="object-contain h-10 w-auto"
                priority
              />
            )}
          </div>
        </div>
      </header>
      <main className="container mx-auto p-4 md:p-8">
        <BrandForm {...clientProps} />
      </main>
      <footer className="py-4 text-center text-sm text-gray-500">
        <p>
          &copy; {new Date().getFullYear()} {clientProps.brandName}. All rights reserved.
        </p>
      </footer>
    </div>
  )
}
