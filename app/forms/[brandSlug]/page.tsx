import { createClient } from "@/utils/supabase/server"
import { notFound } from "next/navigation"
import { ClientForm } from "./client-form"
import type { SafeFormProps } from "@/lib/types"

// Force the page to be dynamic and not use any cache
export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function FormPage({ params }: { params: { brandSlug: string } }) {
  console.log("--- SERVER: STARTING DATA FETCH ---")
  const supabase = createClient()

  // 1. Fetch Brand
  const { data: brand, error: brandError } = await supabase
    .from("brands")
    .select("id, name, slug, logo")
    .eq("slug", params.brandSlug)
    .single()

  if (brandError || !brand) {
    console.error("SERVER ERROR: Brand not found.", brandError)
    notFound()
  }

  // 2. Fetch Locations, Sections, and Items in parallel
  const [locationsRes, sectionsRes, itemsRes] = await Promise.all([
    supabase.from("clinic_locations").select("id, name, address").eq("brand_id", brand.id).order("name"),
    supabase.from("product_sections").select("id, title, sort_order").eq("brand_id", brand.id).order("sort_order"),
    supabase
      .from("product_items")
      .select("id, section_id, name, code, field_type")
      .eq("brand_id", brand.id)
      .order("sort_order"),
  ])

  if (locationsRes.error || sectionsRes.error || itemsRes.error) {
    console.error("SERVER ERROR: Failed to fetch form data.", {
      locationsError: locationsRes.error,
      sectionsError: sectionsRes.error,
      itemsError: itemsRes.error,
    })
    throw new Error("Could not load form data.")
  }

  // 3. Build the completely safe props for the client component
  const safeProps: SafeFormProps = {
    brand: {
      slug: String(brand.slug),
      name: String(brand.name),
      logo: brand.logo ? String(brand.logo) : null,
    },
    locations: (locationsRes.data || []).map((loc) => ({
      value: String(loc.id),
      label: `${String(loc.name)} - ${String(loc.address || "")}`,
    })),
    sections: (sectionsRes.data || []).map((sec) => ({
      id: String(sec.id),
      title: String(sec.title),
      items: (itemsRes.data || [])
        .filter((item) => String(item.section_id) === String(sec.id))
        .map((item) => ({
          id: String(item.id),
          name: String(item.name),
          code: item.code ? String(item.code) : null,
          fieldType: String(item.field_type || "text"),
        })),
    })),
  }

  console.log("--- SERVER: DATA PREPARED FOR CLIENT ---")
  return <ClientForm {...safeProps} />
}
