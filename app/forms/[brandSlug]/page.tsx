import { createClient } from "@/utils/supabase/server"
import { notFound } from "next/navigation"
import { ClientForm } from "./client-form"
import { ErrorDisplay } from "./error-display"
import type { SafeFormProps } from "@/lib/types"

async function getFormData(slug: string) {
  const supabase = createClient()

  const { data: brand, error: brandError } = await supabase
    .from("brands")
    .select("id, name, slug, logo")
    .eq("slug", slug)
    .single()

  if (brandError || !brand) {
    console.error(`[SERVER] getFormData: Brand not found for slug: ${slug}`, brandError)
    return { error: "Brand not found." }
  }

  const [locationsRes, sectionsRes] = await Promise.all([
    supabase.from("clinic_locations").select("id, name, address").eq("brand_id", brand.id),
    supabase
      .from("product_sections")
      .select("id, title, items:product_items(id, name, code, field_type)")
      .eq("brand_id", brand.id)
      .order("position", { ascending: true })
      .order("position", { foreignTable: "product_items", ascending: true }),
  ])

  if (locationsRes.error || sectionsRes.error) {
    console.error(`[SERVER] getFormData: Data fetching error for slug: ${slug}`, {
      locationsError: locationsRes.error,
      sectionsError: sectionsRes.error,
    })
    return { error: "Could not load form data." }
  }

  // Sanitize data to ensure no complex objects or nulls are passed to the client
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
        fieldType: item.field_type ? String(item.field_type) : "text",
      })),
    })),
  }

  return { data: props }
}

export default async function FormPage({ params }: { params: { brandSlug: string } }) {
  const { data, error } = await getFormData(params.brandSlug)

  if (error) {
    return <ErrorDisplay message={error} />
  }
  if (!data) {
    notFound()
  }

  return (
    <main className="container mx-auto max-w-2xl px-4 py-8">
      <ClientForm {...data} />
    </main>
  )
}
