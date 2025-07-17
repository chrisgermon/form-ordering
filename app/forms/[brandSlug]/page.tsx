import { createClient } from "@/utils/supabase/server"
import { notFound } from "next/navigation"
import { ClientForm } from "./client-form"
import type { SafeFormData, LocationOption } from "@/lib/types"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function FormPage({ params }: { params: { brandSlug: string } }) {
  console.log("=== SERVER PAGE START ===")
  console.log("Brand slug:", params.brandSlug)

  const supabase = createClient()

  try {
    // Get brand
    const { data: brand, error: brandError } = await supabase
      .from("brands")
      .select("id, name, slug, logo, active")
      .eq("slug", params.brandSlug)
      .single()

    console.log("Brand result:", { brand, error: brandError })

    if (brandError || !brand) {
      console.error("Brand not found")
      notFound()
    }

    // Get locations
    const { data: locations, error: locationsError } = await supabase
      .from("clinic_locations")
      .select("id, name, address")
      .eq("brand_id", brand.id)
      .order("name")

    console.log("Locations result:", { locations, error: locationsError })

    // Get sections
    const { data: sections, error: sectionsError } = await supabase
      .from("form_sections")
      .select("id, title, order_index")
      .eq("brand_id", brand.id)
      .order("order_index")

    console.log("Sections result:", { sections, error: sectionsError })

    // Get items
    const { data: items, error: itemsError } = await supabase
      .from("form_items")
      .select("id, section_id, name, code, field_type, placeholder, is_required, order_index")
      .eq("brand_id", brand.id)
      .order("order_index")

    console.log("Items result:", { items, error: itemsError })

    // Create safe location options - ONLY STRINGS
    const safeLocationOptions: LocationOption[] = (locations || []).map((loc) => {
      const value = String(loc.id)
      const name = String(loc.name || "Unknown")
      const address = String(loc.address || "No address")
      const label = `${name} - ${address}`

      console.log("Creating location option:", { value, label })

      return { value, label }
    })

    // Create safe sections - ONLY STRINGS
    const safeSections = (sections || []).map((section) => {
      const sectionId = String(section.id)
      const sectionTitle = String(section.title || "Untitled")

      const sectionItems = (items || [])
        .filter((item) => String(item.section_id) === sectionId)
        .map((item) => ({
          id: String(item.id),
          name: String(item.name || "Untitled Item"),
          code: item.code ? String(item.code) : null,
          fieldType: String(item.field_type || "text"),
          placeholder: item.placeholder ? String(item.placeholder) : null,
          isRequired: Boolean(item.is_required),
        }))

      console.log("Creating section:", { sectionId, sectionTitle, itemsCount: sectionItems.length })

      return {
        id: sectionId,
        title: sectionTitle,
        items: sectionItems,
      }
    })

    // Create completely safe form data
    const safeFormData: SafeFormData = {
      brandName: String(brand.name),
      brandSlug: String(brand.slug),
      brandLogo: brand.logo ? String(brand.logo) : null,
      locationOptions: safeLocationOptions,
      sections: safeSections,
    }

    console.log("=== SAFE FORM DATA CREATED ===")
    console.log("Brand name:", safeFormData.brandName)
    console.log("Location options count:", safeFormData.locationOptions.length)
    console.log("Sections count:", safeFormData.sections.length)

    return <ClientForm formData={safeFormData} />
  } catch (error) {
    console.error("=== SERVER ERROR ===", error)
    throw error
  }
}
