import { notFound } from "next/navigation"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import OrderForm from "@/components/order-form"
import type { Brand, ProductSection, ProductItem } from "@/lib/types"

interface PageProps {
  params: {
    brand: string
  }
}

type BrandWithSectionsAndItems = Brand & {
  product_sections: Array<
    ProductSection & {
      product_items: ProductItem[]
    }
  >
}

export default async function BrandFormPage({ params }: PageProps) {
  const { brand: brandSlug } = params
  const supabase = createServerSupabaseClient()

  // Fetch brand data with nested sections and items
  const { data: brandData, error } = await supabase
    .from("brands")
    .select(
      `
    *,
    product_sections (
      *,
      product_items (*)
    )
  `,
    )
    .eq("slug", brandSlug)
    .eq("active", true)
    .single()

  if (error || !brandData) {
    console.error("Error fetching brand:", error)
    notFound()
  }

  // Sort sections and items by sort_order
  const sortedBrand: BrandWithSectionsAndItems = {
    ...brandData,
    product_sections: (brandData.product_sections || [])
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((section) => ({
        ...section,
        product_items: (section.product_items || []).sort((a, b) => a.sort_order - b.sort_order),
      })),
  }

  return <OrderForm brand={sortedBrand} />
}
