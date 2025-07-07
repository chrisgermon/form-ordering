import { createAdminClient } from "@/lib/supabase/admin"
import { OrderForm } from "@/components/order-form"
import { notFound } from "next/navigation"
import type { Brand, Section, ClinicLocation } from "@/lib/types"

async function getBrandData(slug: string) {
  const supabase = createAdminClient()
  const { data: brand, error: brandError } = await supabase
    .from("brands")
    .select("*")
    .eq("slug", slug)
    .eq("active", true)
    .single()

  if (brandError || !brand) {
    console.error(`Error fetching brand with slug '${slug}':`, brandError?.message)
    return null
  }

  const { data: sections, error: sectionsError } = await supabase
    .from("sections")
    .select("*, items(*)")
    .eq("brand_id", brand.id)
    .order("order", { ascending: true })
    .order("order", { foreignTable: "items", ascending: true })

  if (sectionsError) {
    console.error(`Error fetching sections for brand '${slug}':`, sectionsError.message)
    return { brand, sections: [], clinic_locations: [] }
  }

  const { data: clinic_locations, error: clinicsError } = await supabase
    .from("clinic_locations")
    .select("*")
    .eq("brand_id", brand.id)
    .order("name", { ascending: true })

  if (clinicsError) {
    console.error(`Error fetching clinics for brand '${slug}':`, clinicsError.message)
  }

  return {
    brand: brand as Brand,
    sections: (sections as Section[]) || [],
    clinic_locations: (clinic_locations as ClinicLocation[]) || [],
  }
}

export default async function BrandFormPage({ params }: { params: { brand: string } }) {
  const data = await getBrandData(params.brand)

  if (!data || !data.brand) {
    notFound()
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <OrderForm brand={data.brand} sections={data.sections} clinicLocations={data.clinic_locations} />
    </div>
  )
}
