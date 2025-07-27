import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { OrderForm } from "@/components/order-form"
import Image from "next/image"
import type { Brand, Item } from "@/lib/types"

export default async function BrandFormPage({
  params,
}: {
  params: { brand: string }
}) {
  const supabase = createClient()

  // Step 1: Fetch the brand by its slug.
  const { data: brandData, error: brandError } = await supabase
    .from("brands")
    .select("*")
    .eq("slug", params.brand)
    .single()

  if (brandError || !brandData) {
    console.error(`Error fetching brand with slug '${params.brand}':`, brandError)
    notFound()
  }

  // Step 2: Fetch all sections related to this brand, ordered correctly.
  const { data: sectionsData, error: sectionsError } = await supabase
    .from("sections")
    .select("*")
    .eq("brand_id", brandData.id)
    .order("sort_order", { ascending: true })

  let finalBrand: Brand

  if (sectionsError) {
    console.error(`Error fetching sections for brand ID ${brandData.id}:`, sectionsError)
    // If sections fail, proceed with an empty sections array.
    finalBrand = { ...brandData, sections: [] }
  } else {
    const sectionIds = sectionsData.map((s) => s.id)
    let allItems: Item[] = []

    // Step 3: Fetch all items for all sections in a single query if sections exist.
    if (sectionIds.length > 0) {
      const { data: itemsData, error: itemsError } = await supabase
        .from("items")
        .select("*")
        .in("section_id", sectionIds)
        .order("sort_order", { ascending: true })

      if (itemsError) {
        console.error(`Error fetching items for sections ${sectionIds.join(", ")}:`, itemsError)
      } else {
        allItems = itemsData || []
      }
    }

    // Step 4: Map items back to their respective sections.
    const sectionsWithItems = sectionsData.map((section) => ({
      ...section,
      items: allItems.filter((item) => item.section_id === section.id),
    }))

    finalBrand = { ...brandData, sections: sectionsWithItems }
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="mb-8 flex flex-col items-center text-center">
        {finalBrand.logo_url && (
          <Image
            src={finalBrand.logo_url || "/placeholder.svg"}
            alt={`${finalBrand.name} Logo`}
            width={200}
            height={100}
            className="mb-4 h-auto w-auto max-h-24 object-contain"
          />
        )}
        <h1 className="text-3xl font-bold">{finalBrand.name} Order Form</h1>
      </div>
      <OrderForm brand={finalBrand} />
    </div>
  )
}
