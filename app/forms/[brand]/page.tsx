import { notFound } from "next/navigation"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import OrderForm from "@/components/order-form"
import type { Brand } from "@/lib/types"

interface PageProps {
  params: Promise<{ brand: string }>
}

export default async function BrandFormPage({ params }: PageProps) {
  const { brand: brandSlug } = await params

  const supabase = createServerSupabaseClient()

  // Fetch brand with nested sections and items
  const { data: brandData, error } = await supabase
    .from("brands")
    .select(`
      *,
      product_sections (
        *,
        items:product_items (*)
      )
    `)
    .eq("slug", brandSlug)
    .single()

  if (error || !brandData) {
    console.error("Error fetching brand:", error)
    notFound()
  }

  // Sort sections and items by order_index
  if (brandData.product_sections) {
    brandData.product_sections.sort((a: any, b: any) => a.order_index - b.order_index)
    brandData.product_sections.forEach((section: any) => {
      if (section.items) {
        section.items.sort((a: any, b: any) => a.order_index - b.order_index)
      }
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <OrderForm brandData={brandData as Brand} />
    </div>
  )
}
