import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { OrderForm } from "@/components/order-form"
import Image from "next/image"
import type { BrandWithSectionsAndItems } from "@/lib/types"

export default async function BrandFormPage({
  params,
}: {
  params: { brand: string }
}) {
  const supabase = createClient()
  const { data: brand, error } = await supabase
    .from("brands")
    .select(
      `
      *,
      sections:sections(*, items:items(*))
    `,
    )
    .eq("slug", params.brand)
    .single()

  if (error || !brand) {
    console.error("Error fetching brand:", error)
    notFound()
  }

  const typedBrand: BrandWithSectionsAndItems = brand

  // Sort sections and items by their 'order' property
  typedBrand.sections.sort((a, b) => a.order - b.order)
  typedBrand.sections.forEach((section) => {
    if (section.items) {
      section.items.sort((a, b) => a.order - b.order)
    }
  })

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="mb-8 flex flex-col items-center text-center">
        {typedBrand.logo_url && (
          <Image
            src={typedBrand.logo_url || "/placeholder.svg"}
            alt={`${typedBrand.name} Logo`}
            width={200}
            height={100}
            className="mb-4 h-auto w-auto max-h-24 object-contain"
          />
        )}
        <h1 className="text-3xl font-bold">{typedBrand.name} Order Form</h1>
      </div>
      <OrderForm brand={typedBrand} />
    </div>
  )
}
