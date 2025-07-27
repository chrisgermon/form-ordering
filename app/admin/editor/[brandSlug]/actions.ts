"use server"

import { createServerSupabaseClient } from "@/lib/supabase"
import { z } from "zod"
import { revalidatePath } from "next/cache"
import type { Brand } from "@/lib/types"

const formSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Brand name is required"),
  slug: z.string().min(1, "Slug is required"),
  logo: z.string().nullable(),
  primary_color: z.string().nullable(),
  email: z.string().email("Invalid email address"),
  active: z.boolean(),
  clinics: z.array(z.string()).optional(),
  sections: z.array(
    z.object({
      id: z.string(),
      name: z.string().min(1, "Section name is required"),
      description: z.string().nullable(),
      sort_order: z.number(),
      product_items: z.array(
        z.object({
          id: z.string(),
          name: z.string().min(1, "Item name is required"),
          description: z.string().nullable(),
          sort_order: z.number(),
          requires_scan: z.boolean(),
        }),
      ),
    }),
  ),
})

type FormData = z.infer<typeof formSchema>

export async function saveForm(data: FormData, brandId: string | null) {
  const supabase = createServerSupabaseClient()
  const validatedData = formSchema.safeParse(data)

  if (!validatedData.success) {
    return { success: false, error: "Invalid data provided." }
  }

  const { id, sections, ...brandData } = validatedData.data

  let savedBrand: Brand | null = null

  if (brandId) {
    // Update existing brand
    const { data, error } = await supabase.from("brands").update(brandData).eq("id", brandId).select().single()
    if (error) return { success: false, error: error.message }
    savedBrand = data
  } else {
    // Create new brand
    const { data, error } = await supabase.from("brands").insert(brandData).select().single()
    if (error) return { success: false, error: error.message }
    savedBrand = data
  }

  if (!savedBrand) {
    return { success: false, error: "Failed to save brand." }
  }

  // Get existing sections and items to determine what to delete
  const { data: existingSections } = await supabase
    .from("product_sections")
    .select("id, product_items(id)")
    .eq("brand_id", savedBrand.id)
  const existingSectionIds = existingSections?.map((s) => s.id) || []
  const existingItemIds = existingSections?.flatMap((s) => s.product_items.map((i) => i.id)) || []

  const incomingSectionIds = sections.map((s) => s.id)
  const incomingItemIds = sections.flatMap((s) => s.product_items.map((i) => i.id))

  // Upsert sections
  const sectionsToUpsert = sections.map((section, index) => ({
    id: section.id.startsWith("new-") ? undefined : section.id,
    brand_id: savedBrand!.id,
    name: section.name,
    description: section.description,
    sort_order: index,
  }))

  const { error: sectionsError } = await supabase.from("product_sections").upsert(sectionsToUpsert)
  if (sectionsError) return { success: false, error: sectionsError.message }

  // After upserting, we need the actual IDs for new sections
  const { data: updatedSections } = await supabase
    .from("product_sections")
    .select("id, name")
    .eq("brand_id", savedBrand.id)

  // Upsert items
  const itemsToUpsert = sections.flatMap((section, sectionIndex) => {
    // Find the corresponding section ID from the database
    const dbSection = updatedSections?.find((s) => s.name === section.name)
    if (!dbSection) return []

    return section.product_items.map((item, itemIndex) => ({
      id: item.id.startsWith("new-") ? undefined : item.id,
      section_id: dbSection.id,
      name: item.name,
      description: item.description,
      requires_scan: item.requires_scan,
      sort_order: itemIndex,
    }))
  })

  if (itemsToUpsert.length > 0) {
    const { error: itemsError } = await supabase.from("product_items").upsert(itemsToUpsert)
    if (itemsError) return { success: false, error: itemsError.message }
  }

  // Delete old sections and items
  const sectionsToDelete = existingSectionIds.filter((id) => !incomingSectionIds.includes(id))
  if (sectionsToDelete.length > 0) {
    await supabase.from("product_sections").delete().in("id", sectionsToDelete)
  }

  const itemsToDelete = existingItemIds.filter((id) => !incomingItemIds.includes(id))
  if (itemsToDelete.length > 0) {
    await supabase.from("product_items").delete().in("id", itemsToDelete)
  }

  revalidatePath("/admin")
  revalidatePath(`/admin/editor/${savedBrand.slug}`)

  return { success: true, brand: savedBrand }
}
