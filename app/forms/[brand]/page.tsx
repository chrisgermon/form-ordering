import { notFound } from "next/navigation"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { OrderForm } from "@/components/order-form"
import type { Brand, ProductSection, ProductItem } from "@/lib/types"

type FormBrandData = Brand & {
  product_sections: Array<
    ProductSection & {
      product_items: ProductItem[]
    }
  >
}

async function getBrandData(brandSlug: string): Promise<FormBrandData | null> {
  const supabase = createServerComponentClient({ cookies })

  const { data: brand, error } = await supabase
    .from("brands")
    .select(`
      *,
      product_sections (
        *,
        product_items (*)
      )
    `)
    .eq("slug", brandSlug)
    .single()

  if (error || !brand) {
    console.error("Error fetching brand:", error)
    return null
  }

  return brand as FormBrandData
}

interface PageProps {
  params: {
    brand: string
  }
}

export default async function BrandFormPage({ params }: PageProps) {
  const brandData = await getBrandData(params.brand)

  if (!brandData) {
    notFound()
  }

  return <OrderForm brandData={brandData} />
}
