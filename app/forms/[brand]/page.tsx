import { createServerSupabaseClient } from "@/lib/supabase"
import { notFound } from "next/navigation"
import { OrderForm } from "@/components/order-form"
import type { Brand } from "@/lib/types"

export const revalidate = 0 // Revalidate data on every request

async function getBrandData(slug: string): Promise<Brand | null> {
  const supabase = createServerSupabaseClient()

  const { data: brand, error } = await supabase
    .from("brands")
    .select(
      `
      id, name, slug, logo, primary_color, email,
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
    .single()

  if (error || !brand) {
    console.error(`Error fetching brand data for slug '${slug}':`, error)
    return null
  }

  return brand as Brand
}

// This is a dynamic route handler
export default async function BrandFormPage({ params }: { params: { brand: string } }) {
  const brandData = await getBrandData(params.brand)

  if (!brandData) {
    notFound()
  }

  return <OrderForm brandData={brandData} />
}
