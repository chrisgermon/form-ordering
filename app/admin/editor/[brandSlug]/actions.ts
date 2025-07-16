"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import type { BrandData, Item, Section } from "@/lib/types"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const revalidate = (slug: string) => {
  revalidatePath(`/admin/editor/${slug}`, "layout")
  revalidatePath(`/forms/${slug}`)
}

// Brand Data Fetching
export async function getBrand(slug: string): Promise<BrandData | null> {
  const supabase = createAdminClient()

  const { data: brand, error: brandError } = await supabase.from("brands").select("*").eq("slug", slug).single()

  if (brandError) {
    console.error(`Error fetching brand '${slug}':`, brandError.message)
    return null
  }

  const [locationsResult, sectionsResult] = await Promise.all([
    supabase.from("clinic_locations").select("*").eq("brand_id", brand.id),
    supabase.from("product_sections").select("*").eq("brand_id", brand.id).order("sort_order"),
  ])

  if (sectionsResult.error) {
    console.error(`Error fetching product_sections for brand ${slug}:`, sectionsResult.error.message)
    return null
  }

  const clinicLocations = locationsResult.data || []
  const productSections = sectionsResult.data || []

  const sections: Section[] = await Promise.all(
    productSections.map(async (pSection) => {
      const { data: productItems, error: itemsError } = await supabase
        .from("product_items")
        .select("*")
        .eq("section_id", pSection.id)
        .order("sort_order")

      if (itemsError) {
        console.error(`Error fetching items for section ${pSection.id}:`, itemsError.message)
        return null
      }

      const items: Item[] = await Promise.all(
        (productItems || []).map(async (pItem) => {
          const { data: options, error: optionsError } = await supabase
            .from("options")
            .select("*")
            .eq("item_id", pItem.id)
            .order("sort_order")

          if (optionsError) {
            console.error(`Error fetching options for item ${pItem.id}:`, optionsError.message)
          }

          return {
            ...pItem,
            position: pItem.sort_order,
            field_type: pItem.field_type || "text",
            options: options || [],
          }
        }),
      )

      return {
        id: pSection.id,
        title: pSection.title,
        position: pSection.sort_order,
        brand_id: pSection.brand_id,
        items: items,
      }
    }),
  ).then((results) => results.filter((s): s is Section => s !== null))

  return {
    ...brand,
    clinic_locations: clinicLocations,
    sections: sections,
  } as BrandData
}

// Section Actions
const sectionSchema = z.object({
  title: z.string().min(1),
  brand_id: z.string(),
  sort_order: z.number(),
})
export async function createSection(data: z.infer<typeof sectionSchema>) {
  const supabase = createAdminClient()
  const { data: brand } = await supabase.from("brands").select("slug").eq("id", data.brand_id).single()
  if (!brand) return { success: false, message: "Brand not found." }

  const { error } = await supabase.from("product_sections").insert(data)
  if (error) return { success: false, message: error.message }
  revalidate(brand.slug)
  return { success: true }
}

export async function updateSection(id: string, data: { title: string }) {
  const supabase = createAdminClient()
  const { data: section } = await supabase.from("product_sections").select("brands(slug)").eq("id", id).single()
  if (!section) return { success: false, message: "Section not found." }

  const { error } = await supabase.from("product_sections").update(data).eq("id", id)
  if (error) return { success: false, message: error.message }
  revalidate(section.brands!.slug)
  return { success: true }
}

export async function deleteSection(id: string) {
  const supabase = createAdminClient()
  const { data: section } = await supabase.from("product_sections").select("brands(slug)").eq("id", id).single()
  if (!section) return { success: false, message: "Section not found." }

  const { error } = await supabase.from("product_sections").delete().eq("id", id)
  if (error) return { success: false, message: error.message }
  revalidate(section.brands!.slug)
  return { success: true }
}

export async function updateSectionOrder(order: { id: string; sort_order: number }[]) {
  const supabase = createAdminClient()
  const { data: brandData, error: brandError } = await supabase
    .from("product_sections")
    .select("brands(slug)")
    .eq("id", order[0].id)
    .single()
  if (brandError || !brandData) return { success: false, message: "Could not find brand to revalidate." }

  const { error } = await supabase.from("product_sections").upsert(order)
  if (error) return { success: false, message: error.message }

  revalidate(brandData.brands!.slug)
  return { success: true }
}

// Item Actions
const itemSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  description: z.string().optional(),
  field_type: z.string(),
  placeholder: z.string().optional(),
  is_required: z.boolean(),
  section_id: z.string(),
  brand_id: z.string(),
  sort_order: z.number(),
})
export async function createItem(data: z.infer<typeof itemSchema>) {
  const supabase = createAdminClient()
  const { data: brand } = await supabase.from("brands").select("slug").eq("id", data.brand_id).single()
  if (!brand) return { success: false, message: "Brand not found." }

  const { error } = await supabase.from("product_items").insert(data)
  if (error) return { success: false, message: error.message }
  revalidate(brand.slug)
  return { success: true }
}

export async function updateItem(
  id: string,
  data: Omit<z.infer<typeof itemSchema>, "section_id" | "brand_id" | "sort_order">,
) {
  const supabase = createAdminClient()
  const { data: item } = await supabase.from("product_items").select("brands(slug)").eq("id", id).single()
  if (!item) return { success: false, message: "Item not found." }

  const { error } = await supabase.from("product_items").update(data).eq("id", id)
  if (error) return { success: false, message: error.message }
  revalidate(item.brands!.slug)
  return { success: true }
}

export async function deleteItem(id: string) {
  const supabase = createAdminClient()
  const { data: item } = await supabase.from("product_items").select("brands(slug)").eq("id", id).single()
  if (!item) return { success: false, message: "Item not found." }

  const { error } = await supabase.from("product_items").delete().eq("id", id)
  if (error) return { success: false, message: error.message }
  revalidate(item.brands!.slug)
  return { success: true }
}

// Option Actions
const optionSchema = z.object({
  id: z.string().optional(),
  label: z.string(),
  value: z.string(),
  item_id: z.string(),
  brand_id: z.string(),
  sort_order: z.number(),
})
export async function updateOrCreateOption(data: z.infer<typeof optionSchema>) {
  const supabase = createAdminClient()
  const { id, ...upsertData } = data
  const { error } = await supabase
    .from("options")
    .upsert({ id, ...upsertData }, { onConflict: "id", defaultToNull: false })
  if (error) {
    console.error("Option upsert error:", error)
    return { success: false, message: error.message }
  }
  return { success: true }
}

export async function deleteOption(id: string) {
  const supabase = createAdminClient()
  const { error } = await supabase.from("options").delete().eq("id", id)
  if (error) return { success: false, message: error.message }
  return { success: true }
}

export async function getUploadedFiles() {
  const supabase = createAdminClient()
  const { data, error } = await supabase.storage.from("files").list("", {
    limit: 100,
    offset: 0,
    sortBy: { column: "created_at", order: "desc" },
  })

  if (error) {
    console.error("Error fetching files:", error)
    return []
  }
  return data
}
