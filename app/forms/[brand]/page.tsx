import { createClient } from "@/lib/supabase/server"
import OrderForm from "@/components/order-form"
import type { BrandWithSections } from "@/lib/types"
import { notFound } from "next/navigation"

export default async function BrandFormPage({ params }: { params: { brand: string } }) {
  const supabase = createClient()

  const { data: brand, error } = await supabase
    .from("brands")
    .select(
      `
      *,
      sections (
        *,
        items (
          *
        )
      )
    `,
    )
    .eq("slug", params.brand)
    .order("order", { foreignTable: "sections" })
    .order("order", { foreignTable: "sections.items" })
    .single()

  if (error || !brand) {
    console.error(`Error fetching brand ${params.brand}:`, error)
    notFound()
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <OrderForm brand={brand as BrandWithSections} />
    </main>
  )
}
