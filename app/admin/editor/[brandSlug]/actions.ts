"use server"

import { createServerSupabaseClient } from "@/lib/supabase"
import { z } from "zod"
import { revalidatePath } from "next/cache"

export const formSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Brand name is required"),
  slug: z.string().min(1, "Slug is required"),
  logo: z.string().nullable().optional(),
  primary_color: z.string().nullable().optional(),
  email: z.string().email("Invalid email address"),
  active: z.boolean(),
  clinics: z.array(z.string()).optional(),
  sections: z.array(
    z.object({
      id: z.string(),
      name: z.string().min(1, "Section name is required"),
      description: z.string().nullable().optional(),
      sort_order: z.number(),
      product_items: z.array(
        z.object({
          id: z.string(),
          name: z.string().min(1, "Item name is required"),
          description: z.string().nullable().optional(),
          sort_order: z.number(),
          requires_scan: z.boolean(),
        }),
      ),
    }),
  ),
})

export type FormData = z.infer<typeof formSchema>

export async function saveForm(
  prevState: any,
  formData: FormData,
): Promise<{ success: boolean; error: string | null; brand: { slug: string } | null }> {
  const validatedData = formSchema.safeParse(formData)

  if (!validatedData.success) {
    console.error("Zod validation failed:", validatedData.error.flatten())
    return { success: false, error: "Invalid data provided.", brand: null }
  }

  const supabase = createServerSupabaseClient()
  const { id: brandId, sections, ...brandData } = validatedData.data

  // 1. Upsert Brand
  const { data: savedBrand, error: brandError } = await supabase
    .from("brands")
    .upsert({ id: brandId || undefined, ...brandData })
    .select()
    .single()

  if (brandError) return { success: false, error: `Brand Error: ${brandError.message}`, brand: null }
  if (!savedBrand) return { success: false, error: "Failed to save brand.", brand: null }

  // 2. Handle Sections and Items
  const incomingSectionIds = sections.map((s) => s.id)

  // Delete sections that are no longer present
  const { data: existingSections } = await supabase.from("product_sections").select("id").eq("brand_id", savedBrand.id)
  if (existingSections) {
    const sectionsToDelete = existingSections.filter((s) => !incomingSectionIds.includes(s.id)).map((s) => s.id)
    if (sectionsToDelete.length > 0) {
      await supabase.from("product_sections").delete().in("id", sectionsToDelete)
    }
  }

  // Upsert sections
  const sectionsToUpsert = sections.map((section, index) => ({
    id: section.id.startsWith("new-") ? undefined : section.id,
    brand_id: savedBrand.id,
    name: section.name,
    description: section.description,
    sort_order: index,
  }))

  const { data: upsertedSections, error: sectionsError } = await supabase
    .from("product_sections")
    .upsert(sectionsToUpsert)
    .select("id, name")

  if (sectionsError) return { success: false, error: `Section Error: ${sectionsError.message}`, brand: null }
  if (!upsertedSections) return { success: false, error: "Failed to retrieve updated sections.", brand: null }

  const sectionIdMap = new Map<string, string>()
  sections.forEach((formSection) => {
    const dbSection = upsertedSections.find((s) => s.name === formSection.name)
    if (dbSection) {
      sectionIdMap.set(formSection.id, dbSection.id)
    }
  })

  const allDbSectionIds = upsertedSections.map((s) => s.id)
  const incomingItemIds = sections.flatMap((s) => s.product_items.map((i) => i.id))

  // Delete items that are no longer present
  if (allDbSectionIds.length > 0) {
    const { data: existingItems } = await supabase.from("product_items").select("id").in("section_id", allDbSectionIds)
    if (existingItems) {
      const itemsToDelete = existingItems.filter((i) => !incomingItemIds.includes(i.id)).map((i) => i.id)
      if (itemsToDelete.length > 0) {
        await supabase.from("product_items").delete().in("id", itemsToDelete)
      }
    }
  }

  // Upsert items
  const itemsToUpsert = sections.flatMap((section) => {
    const dbSectionId = sectionIdMap.get(section.id)
    if (!dbSectionId) return []
    return section.product_items.map((item, itemIndex) => ({
      id: item.id.startsWith("new-") ? undefined : item.id,
      section_id: dbSectionId,
      name: item.name,
      description: item.description,
      requires_scan: item.requires_scan,
      sort_order: itemIndex,
    }))
  })

  if (itemsToUpsert.length > 0) {
    const { error: itemsError } = await supabase.from("product_items").upsert(itemsToUpsert)
    if (itemsError) return { success: false, error: `Item Error: ${itemsError.message}`, brand: null }
  }

  revalidatePath("/admin")
  revalidatePath(`/admin/editor/${savedBrand.slug}`)
  revalidatePath(`/forms/${savedBrand.slug}`)

  return { success: true, error: null, brand: { slug: savedBrand.slug } }
}
