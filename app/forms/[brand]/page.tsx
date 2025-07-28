import { notFound } from "next/navigation"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import OrderForm from "@/components/order-form"
import type { Brand } from "@/lib/types"

interface PageProps {
  params: {
    brand: string
  }
}

export default async function BrandFormPage({ params }: PageProps) {
  const supabase = createServerSupabaseClient()

  // Fetch brand data with nested sections and items
  const { data: brandData, error } = await supabase
    .from("brands")
    .select(`
      *,
      product_sections (
        *,
        items (*)
      )
    `)
    .eq("slug", params.brand)
    .single()

  if (error || !brandData) {
    console.error("Error fetching brand:", error)
    notFound()
  }

  // Sort sections and items by order_index
  const sortedBrand: Brand = {
    ...brandData,
    product_sections:
      brandData.product_sections
        ?.sort((a, b) => a.order_index - b.order_index)
        .map((section) => ({
          ...section,
          items: section.items?.sort((a, b) => a.order_index - b.order_index) || [],
        })) || [],
  }

  return <OrderForm brandData={sortedBrand} />
}
