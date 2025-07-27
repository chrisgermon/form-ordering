"use server"

import { createServerSupabaseClient } from "@/lib/supabase"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import type { Brand, ProductSection, Item } from "@/lib/types"

type FormState = {
  brand: Partial<Brand>
  sections: (Partial<ProductSection> & { items: Partial<Item>[] })[]
}

export async function saveForm(prevState: any, formData: FormData): Promise<{ message: string; error?: boolean }> {
  const supabase = createServerSupabaseClient()
  const data = JSON.parse(formData.get("data") as string) as FormState

  const { brand, sections } = data

  // 1. Upsert Brand
  const { data: savedBrand, error: brandError } = await supabase
    .from("brands")
    .upsert({
      id: brand.id,
      name: brand.name,
      slug: brand.slug,
      logo: brand.logo,
      submission_recipients: brand.submission_recipients,
      active: brand.active,
    })
    .select()
    .single()

  if (brandError) {
    console.error("Error saving brand:", brandError)
    return { message: `Error saving brand: ${brandError.message}`, error: true }
  }

  const brandId = savedBrand.id
  const incomingSectionIds = sections.map((s) => s.id).filter(Boolean)

  // 2. Delete sections that are no longer present
  if (incomingSectionIds.length > 0) {
    const { error: deleteSectionsError } = await supabase
      .from("product_sections")
      .delete()
      .eq("brand_id", brandId)
      .not("id", "in", `(${incomingSectionIds.join(",")})`)

    if (deleteSectionsError) {
      console.error("Error deleting old sections:", deleteSectionsError)
      // Not returning error to allow upserts to proceed
    }
  } else if (brand.id) {
    // If there are no incoming sections for an existing brand, delete all of them.
    const { error: deleteAllSectionsError } = await supabase.from("product_sections").delete().eq("brand_id", brandId)
    if (deleteAllSectionsError) {
      console.error("Error deleting all sections:", deleteAllSectionsError)
    }
  }

  // 3. Upsert sections and their items
  for (const [i, section] of sections.entries()) {
    const { data: savedSection, error: sectionError } = await supabase
      .from("product_sections")
      .upsert({
        id: section.id,
        name: section.name,
        brand_id: brandId,
        position: i,
      })
      .select()
      .single()

    if (sectionError) {
      console.error("Error saving section:", sectionError)
      return { message: `Error saving section: ${sectionError.message}`, error: true }
    }

    const sectionId = savedSection.id
    const incomingItemIds = section.items.map((item) => item.id).filter(Boolean)

    // 4. Delete items that are no longer in this section
    if (incomingItemIds.length > 0) {
      const { error: deleteItemsError } = await supabase
        .from("items")
        .delete()
        .eq("section_id", sectionId)
        .not("id", "in", `(${incomingItemIds.join(",")})`)

      if (deleteItemsError) {
        console.error("Error deleting old items:", deleteItemsError)
      }
    } else {
      // If there are no items, delete all items for this section
      const { error: deleteAllItemsError } = await supabase.from("items").delete().eq("section_id", sectionId)

      if (deleteAllItemsError) {
        console.error("Error deleting all items:", deleteAllItemsError)
      }
    }

    // 5. Upsert items
    if (section.items.length > 0) {
      const itemsToUpsert = section.items.map((item, j) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        price: item.price,
        section_id: sectionId,
        position: j,
      }))

      const { error: itemError } = await supabase.from("items").upsert(itemsToUpsert)

      if (itemError) {
        console.error("Error saving items:", itemError)
        return { message: `Error saving items: ${itemError.message}`, error: true }
      }
    }
  }

  revalidatePath("/admin")
  revalidatePath(`/admin/editor/${savedBrand.slug}`)
  revalidatePath(`/forms/${savedBrand.slug}`)

  if (!brand.id) {
    redirect(`/admin/editor/${savedBrand.slug}`)
  }

  return { message: "Form saved successfully!" }
}
