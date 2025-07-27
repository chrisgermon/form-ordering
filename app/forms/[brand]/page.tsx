import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import OrderForm from "@/components/order-form"
import type { BrandWithSectionsAndItems } from "@/lib/types"

type Props = {
  params: {
    brand: string
  }
}

export default async function BrandFormPage({ params }: Props) {
  const supabase = createClient()
  const { data: brand, error } = await supabase
    .from("brands")
    .select("*, product_sections(*, product_items(*))")
    .eq("slug", params.brand)
    .single()

  if (error || !brand) {
    console.error("Error fetching brand data for form:", error)
    notFound()
  }

  return <OrderForm brand={brand as BrandWithSectionsAndItems} />
}
