import { createAdminSupabaseClient } from "@/lib/supabase"
import { OrderForm } from "@/components/order-form"
import type { Brand, ProductSection, ProductItem } from "@/lib/types"
import { notFound } from "next/navigation"

type BrandPageProps = {
  params: {
    brand: string
  }
}

type FormBrandData = Brand & {
  product_sections: Array<
    ProductSection & {
      product_items: ProductItem[]
    }
  >
}

async function getBrandData(slug: string): Promise<FormBrandData | null> {
  const supabase = createAdminSupabaseClient()
  const { data, error } = await supabase
    .from("brands")
    .select(
      `
      *,
      product_sections (
        *,
        product_items (
          *
        )
      )
    `,
    )
    .eq("slug", slug)
    .eq("active", true)
    .order("sort_order", { foreignTable: "product_sections" })
    .order("sort_order", { foreignTable: "product_sections.product_items" })
    .single()

  if (error) {
    console.error("Error fetching brand data:", error)
    return null
  }

  return data
}

export default async function BrandPage({ params }: BrandPageProps) {
  const brandData = await getBrandData(params.brand)

  if (!brandData) {
    notFound()
  }

  return <OrderForm brandData={brandData} />
}
