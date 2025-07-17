import { notFound } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import { ClientForm } from "./client-form"

export const revalidate = 0

export default async function FormPage({ params }: { params: { brandSlug: string } }) {
  const supabase = createClient()
  const { brandSlug } = params

  // Get brand
  const { data: brand, error: brandError } = await supabase
    .from("brands")
    .select("id, name, slug, logo, active")
    .eq("slug", brandSlug)
    .single()

  if (brandError || !brand || !brand.active) {
    notFound()
  }

  // Get locations - VERY SIMPLE QUERY
  const { data: locations } = await supabase
    .from("clinic_locations")
    .select("id, name, address")
    .eq("brand_id", brand.id)

  // Get sections with items and options - SEPARATE QUERIES FOR SAFETY
  const { data: sections } = await supabase
    .from("sections")
    .select("id, title, position, brand_id")
    .eq("brand_id", brand.id)
    .order("position")

  const { data: items } = await supabase.from("items").select("*").eq("brand_id", brand.id).order("position")

  const { data: options } = await supabase.from("options").select("*").eq("brand_id", brand.id).order("sort_order")

  // Build location options with EXTREME safety
  const safeLocationOptions = (locations || []).map((loc) => {
    // Force everything to be a string, no matter what
    const id = String(loc?.id || "")
    const name = String(loc?.name || "Unknown Location")
    const address = String(loc?.address || "No Address")
    const label = `${name} - ${address}`

    return {
      value: id,
      label: label,
    }
  })

  // Build sections with EXTREME safety
  const safeSections = (sections || []).map((section) => ({
    id: String(section?.id || ""),
    title: String(section?.title || "Untitled Section"),
    position: Number(section?.position || 0),
    brand_id: String(section?.brand_id || ""),
    items: (items || [])
      .filter((item) => String(item?.section_id) === String(section?.id))
      .map((item) => ({
        id: String(item?.id || ""),
        section_id: String(item?.section_id || ""),
        brand_id: String(item?.brand_id || ""),
        code: String(item?.code || ""),
        name: String(item?.name || "Untitled Item"),
        description: item?.description ? String(item.description) : null,
        sample_link: item?.sample_link ? String(item.sample_link) : null,
        field_type: String(item?.field_type || "text") as any,
        placeholder: item?.placeholder ? String(item.placeholder) : null,
        is_required: Boolean(item?.is_required),
        position: Number(item?.position || 0),
        options: (options || [])
          .filter((option) => String(option?.item_id) === String(item?.id))
          .map((option) => ({
            id: String(option?.id || ""),
            item_id: String(option?.item_id || ""),
            brand_id: String(option?.brand_id || ""),
            value: String(option?.value || ""),
            label: option?.label ? String(option.label) : null,
            sort_order: Number(option?.sort_order || 0),
          })),
      })),
  }))

  const formData = {
    brandSlug: String(brand?.slug || ""),
    brandName: String(brand?.name || ""),
    brandLogo: brand?.logo ? String(brand.logo) : null,
    locationOptions: safeLocationOptions,
    sections: safeSections,
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-8 text-center">{brand.name} Order Form</h1>
      <ClientForm formData={formData} />
    </div>
  )
}
