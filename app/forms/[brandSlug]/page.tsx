import { createClient } from "@/utils/supabase/server"
import { notFound } from "next/navigation"
import { ClientForm } from "./client-form"

// Force no caching
export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function FormPage({ params }: { params: { brandSlug: string } }) {
  console.log("=== SERVER PAGE RENDER START ===")
  console.log("Brand slug:", params.brandSlug)

  const supabase = createClient()

  try {
    // Fetch brand with explicit error handling
    console.log("Fetching brand...")
    const { data: brand, error: brandError } = await supabase
      .from("brands")
      .select("id, name, slug, logo, active")
      .eq("slug", params.brandSlug)
      .single()

    console.log("Brand query result:", { brand, error: brandError })

    if (brandError || !brand) {
      console.error("Brand not found:", brandError)
      notFound()
    }

    // Fetch locations with explicit error handling
    console.log("Fetching locations for brand:", brand.id)
    const { data: locations, error: locationsError } = await supabase
      .from("clinic_locations")
      .select("id, name, address, brand_id")
      .eq("brand_id", brand.id)
      .order("name")

    console.log("Locations query result:", { locations, error: locationsError })

    if (locationsError) {
      console.error("Error fetching locations:", locationsError)
    }

    // Fetch sections with explicit error handling
    console.log("Fetching sections for brand:", brand.id)
    const { data: sections, error: sectionsError } = await supabase
      .from("form_sections")
      .select(`
        id,
        title,
        order_index,
        brand_id,
        items:form_items(
          id,
          name,
          code,
          description,
          field_type,
          placeholder,
          is_required,
          order_index,
          section_id,
          brand_id
        )
      `)
      .eq("brand_id", brand.id)
      .order("order_index")

    console.log("Sections query result:", { sections, error: sectionsError })

    if (sectionsError) {
      console.error("Error fetching sections:", sectionsError)
    }

    // Create completely safe location options - ONLY strings
    const safeLocationOptions = (locations || []).map((location) => {
      const id = String(location?.id || "")
      const name = String(location?.name || "Unknown Location")
      const address = String(location?.address || "No Address")
      const label = `${name} - ${address}`

      console.log("Creating location option:", { id, name, address, label })

      return {
        value: id,
        label: label,
      }
    })

    // Create completely safe sections data
    const safeSections = (sections || []).map((section) => {
      const sectionData = {
        id: String(section?.id || ""),
        title: String(section?.title || "Untitled Section"),
        order_index: Number(section?.order_index || 0),
        brand_id: String(section?.brand_id || ""),
        items: (section?.items || [])
          .map((item) => ({
            id: String(item?.id || ""),
            name: String(item?.name || "Untitled Item"),
            code: item?.code ? String(item.code) : undefined,
            description: item?.description ? String(item.description) : undefined,
            field_type: String(item?.field_type || "text"),
            placeholder: item?.placeholder ? String(item.placeholder) : undefined,
            is_required: Boolean(item?.is_required),
            order_index: Number(item?.order_index || 0),
            section_id: String(item?.section_id || ""),
            brand_id: String(item?.brand_id || ""),
          }))
          .sort((a, b) => a.order_index - b.order_index),
      }

      console.log("Created section:", sectionData)
      return sectionData
    })

    // Create the final form data object with ONLY safe data
    const formData = {
      brand: {
        name: String(brand?.name || ""),
        slug: String(brand?.slug || ""),
        logo: brand?.logo ? String(brand.logo) : undefined,
      },
      locationOptions: safeLocationOptions,
      sections: safeSections,
    }

    console.log("=== FINAL FORM DATA ===")
    console.log("Brand:", formData.brand)
    console.log("Location options count:", formData.locationOptions.length)
    console.log("Sections count:", formData.sections.length)
    console.log("Location options:", JSON.stringify(formData.locationOptions, null, 2))
    console.log("=== SERVER PAGE RENDER END ===")

    return <ClientForm formData={formData} />
  } catch (error) {
    console.error("=== SERVER ERROR ===", error)
    throw error
  }
}
