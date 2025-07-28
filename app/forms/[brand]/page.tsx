import { notFound } from "next/navigation"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { OrderForm } from "@/components/order-form"
import type { Brand, ProductSection, ProductItem } from "@/lib/types"

type BrandWithSections = Brand & {
  product_sections: Array<
    ProductSection & {
      product_items: ProductItem[]
    }
  >
}

export default async function BrandFormPage({ params }: { params: { brand: string } }) {
  const supabase = createServerSupabaseClient()

  // Fetch brand data with sections and items
  const { data: brand, error } = await supabase
    .from("brands")
    .select(`
      *,
      product_sections (
        *,
        product_items (*)
      )
    `)
    .eq("slug", params.brand)
    .eq("active", true)
    .single()

  if (error || !brand) {
    console.error("Error fetching brand:", error)
    notFound()
  }

  // Sort sections and items by sort_order
  const sortedBrand: BrandWithSections = {
    ...brand,
    product_sections: (brand.product_sections || [])
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((section) => ({
        ...section,
        product_items: (section.product_items || []).sort((a, b) => a.sort_order - b.sort_order),
      })),
  }

  return <OrderForm brandData={sortedBrand} />
}
