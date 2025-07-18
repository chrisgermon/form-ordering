import { createClient } from "@/utils/supabase/server"
import { ClientForm } from "./client-form"
import { ErrorDisplay } from "./error-display"
import type { SafeFormProps } from "@/lib/types"

export const dynamic = "force-dynamic"
export const revalidate = 0

async function getFormData(brandSlug: string): Promise<(SafeFormProps & { error?: null }) | { error: string }> {
  console.log(`[SERVER] getFormData: Fetching data for slug: ${brandSlug}`)
  const supabase = createClient()

  const { data: brand, error: brandError } = await supabase
    .from("brands")
    .select("id, name, slug, logo")
    .eq("slug", brandSlug)
    .single()

  if (brandError || !brand) {
    console.error(`[SERVER] getFormData: Brand fetch error for slug "${brandSlug}".`, brandError)
    return { error: JSON.stringify(brandError || "Brand not found.") }
  }
  console.log(`[SERVER] getFormData: Found brand "${brand.name}" (ID: ${brand.id})`)

  const [locationsRes, sectionsRes] = await Promise.all([
    supabase.from("clinic_locations").select("id, name, address").eq("brand_id", brand.id).order("name"),
    supabase
      .from("product_sections")
      .select("id, title, sort_order, items:product_items(id, name, code, sort_order)") // Removed field_type to prevent crash
      .eq("brand_id", brand.id)
      .order("sort_order", { ascending: true })
      .order("sort_order", { foreignTable: "product_items", ascending: true }),
  ])

  if (locationsRes.error || sectionsRes.error) {
    console.error(`[SERVER] getFormData: Data fetch error for brand "${brand.name}".`, {
      locationsError: locationsRes.error,
      sectionsError: sectionsRes.error,
    })
    return { error: JSON.stringify({ locationsError: locationsRes.error, sectionsError: sectionsRes.error }) }
  }
  console.log(`[SERVER] getFormData: Found ${locationsRes.data?.length ?? 0} locations.`)
  console.log(`[SERVER] getFormData: Found ${sectionsRes.data?.length ?? 0} sections.`)

  const props: SafeFormProps = {
    brand: {
      id: String(brand.id),
      name: String(brand.name),
      slug: String(brand.slug),
      logo: brand.logo ? String(brand.logo) : null,
    },
    locations: (locationsRes.data || []).map((loc) => ({
      value: String(loc.id),
      label: `${String(loc.name)} - ${String(loc.address || "")}`,
    })),
    sections: (sectionsRes.data || []).map((sec) => ({
      id: String(sec.id),
      title: String(sec.title),
      items: (sec.items || []).map((item: any) => ({
        id: String(item.id),
        name: String(item.name),
        code: item.code ? String(item.code) : null,
        fieldType: item.field_type ? String(item.field_type) : "text", // Safely default
      })),
    })),
  }

  return { ...props, error: null }
}

export default async function FormPage({ params }: { params: { brandSlug: string } }) {
  const formData = await getFormData(params.brandSlug)

  if (formData.error) {
    return <ErrorDisplay error={formData.error} />
  }

  return <ClientForm {...formData} />
}
