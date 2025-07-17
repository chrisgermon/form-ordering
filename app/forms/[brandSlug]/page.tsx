import { createClient } from "@/utils/supabase/server"
import { notFound } from "next/navigation"
import { ClientForm } from "./client-form"
import type { ClientFormProps } from "@/lib/types"

// Force dynamic rendering and disable caching
export const dynamic = "force-dynamic"
export const revalidate = 0

async function getFormData(brandSlug: string): Promise<ClientFormProps> {
  const supabase = createClient()

  // 1. Fetch Brand
  const { data: brandData, error: brandError } = await supabase
    .from("brands")
    .select("id, name, slug, logo_url")
    .eq("slug", brandSlug)
    .single()

  if (brandError || !brandData) {
    console.error("Error fetching brand:", brandError)
    notFound()
  }

  // 2. Fetch Locations
  const { data: locationsData, error: locationsError } = await supabase
    .from("clinic_locations")
    .select("id, name, address")
    .eq("brand_id", brandData.id)

  if (locationsError) {
    console.error("Error fetching locations:", locationsError)
    throw new Error("Could not fetch clinic locations.")
  }

  // 3. Fetch Sections and their Items
  const { data: sectionsData, error: sectionsError } = await supabase
    .from("product_sections")
    .select("id, title, product_items (id, name, code, field_type)")
    .eq("brand_id", brandData.id)
    .order("sort_order", { ascending: true })
    .order("sort_order", { foreignTable: "product_items", ascending: true })

  if (sectionsError) {
    console.error("Error fetching sections/items:", sectionsError)
    throw new Error("Could not fetch form sections.")
  }

  // 4. Sanitize and format data for the client
  const props: ClientFormProps = {
    brand: {
      slug: String(brandData.slug),
      name: String(brandData.name),
      logo: brandData.logo_url ? String(brandData.logo_url) : null,
    },
    locations: (locationsData || []).map((loc) => ({
      value: String(loc.id),
      label: `${String(loc.name)} - ${String(loc.address || "")}`,
    })),
    sections: (sectionsData || []).map((sec) => ({
      id: String(sec.id),
      title: String(sec.title),
      items: (sec.product_items || []).map((item) => ({
        id: String(item.id),
        name: String(item.name),
        code: item.code ? String(item.code) : null,
        fieldType: String(item.field_type),
      })),
    })),
  }

  return props
}

export default async function FormPage({ params }: { params: { brandSlug: string } }) {
  const formData = await getFormData(params.brandSlug)
  return <ClientForm {...formData} />
}
