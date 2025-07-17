import { createClient } from "@/utils/supabase/server"
import { notFound } from "next/navigation"
import { ClientForm } from "./client-form"
import type { Brand, ClinicLocation, FormSection, FormData } from "@/lib/types"

export default async function FormPage({ params }: { params: { brandSlug: string } }) {
  const supabase = createClient()

  // Fetch brand
  const { data: brand, error: brandError } = await supabase
    .from("brands")
    .select("*")
    .eq("slug", params.brandSlug)
    .single()

  if (brandError || !brand) {
    console.error("Brand not found:", brandError)
    notFound()
  }

  // Fetch locations for this brand
  const { data: locations, error: locationsError } = await supabase
    .from("clinic_locations")
    .select("*")
    .eq("brand_id", brand.id)
    .order("name")

  if (locationsError) {
    console.error("Error fetching locations:", locationsError)
  }

  // Fetch sections and items for this brand
  const { data: sections, error: sectionsError } = await supabase
    .from("form_sections")
    .select(`
      *,
      items:form_items(*)
    `)
    .eq("brand_id", brand.id)
    .order("order_index")

  if (sectionsError) {
    console.error("Error fetching sections:", sectionsError)
  }

  // Prepare form data
  const formData: FormData = {
    brand: brand as Brand,
    locations: (locations || []) as ClinicLocation[],
    sections: (sections || []).map((section) => ({
      ...section,
      items: (section.items || []).sort((a, b) => a.order_index - b.order_index),
    })) as FormSection[],
  }

  console.log("Form data prepared:", {
    brand: formData.brand.name,
    locationsCount: formData.locations.length,
    sectionsCount: formData.sections.length,
  })

  return <ClientForm formData={formData} />
}
