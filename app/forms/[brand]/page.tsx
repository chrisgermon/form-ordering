import { createServerSupabaseClient } from "@/lib/supabase"
import { notFound } from "next/navigation"
import { OrderForm } from "@/components/order-form"
import type { Brand } from "@/lib/types"

export const revalidate = 0 // Revalidate data on every request

async function getBrandData(slug: string): Promise<Brand | null> {
  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase
    .from("brands")
    .select(
      `
      id, name, slug, logo, email, clinics, initials,
      product_sections (
        id, title, sort_order, brand_id,
        product_items (
          id, code, name, description, quantities, sample_link, sort_order, section_id, brand_id
        )
      )
    `,
    )
    .eq("slug", slug)
    .eq("active", true)
    .order("sort_order", { foreignTable: "product_sections", ascending: true })
    .order("sort_order", { foreignTable: "product_sections.product_items", ascending: true })
    .limit(1) // Use limit(1) instead of single() to avoid throwing an error

  if (error) {
    console.error(`Error fetching brand data for slug '${slug}':`, error)
    return null
  }

  // If no data is returned, it's a 404
  if (!data || data.length === 0) {
    return null
  }

  return data[0] as Brand
}

// This is a dynamic route handler
export default async function BrandFormPage({ params }: { params: { brand: string } }) {
  const brandData = await getBrandData(params.brand)

  if (!brandData) {
    notFound()
  }

  return <OrderForm brandData={brandData} />
}
