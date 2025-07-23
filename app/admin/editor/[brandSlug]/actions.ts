"use server"

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import type { Section } from "@/lib/types"

const revalidate = (slug: string) => {
  revalidatePath(`/admin/editor/${slug}`, "layout")
  revalidatePath(`/forms/${slug}`)
}

// Section Actions
const sectionSchema = z.object({
  title: z.string().min(1),
  brand_id: z.string(),
  position: z.number(),
})
export async function createSection(data: z.infer<typeof sectionSchema>) {
  const supabase = createClient()
  const { data: brand } = await supabase.from("brands").select("slug").eq("id", data.brand_id).single()
  if (!brand) return { success: false, message: "Brand not found." }

  const { error } = await supabase.from("sections").insert(data)
  if (error) return { success: false, message: error.message }
  revalidate(brand.slug)
  return { success: true }
}

export async function updateSection(id: string, data: { title: string }) {
  const supabase = createClient()
  const { data: section } = await supabase.from("sections").select("brands(slug)").eq("id", id).single()
  if (!section) return { success: false, message: "Section not found." }

  const { error } = await supabase.from("sections").update(data).eq("id", id)
  if (error) return { success: false, message: error.message }
  revalidate(section.brands!.slug)
  return { success: true }
}

export async function deleteSection(id: string) {
  const supabase = createClient()
  const { data: section } = await supabase.from("sections").select("brands(slug)").eq("id", id).single()
  if (!section) return { success: false, message: "Section not found." }

  const { error } = await supabase.from("sections").delete().eq("id", id)
  if (error) return { success: false, message: error.message }
  revalidate(section.brands!.slug)
  return { success: true }
}

export async function updateSectionOrder(order: { id: string; position: number }[]) {
  const supabase = createClient()
  const { data: brandData, error: brandError } = await supabase
    .from("sections")
    .select("brands(slug)")
    .eq("id", order[0].id)
    .single()
  if (brandError || !brandData) return { success: false, message: "Could not find brand to revalidate." }

  const { error } = await supabase.from("sections").upsert(order)
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
  position: z.number(),
})
export async function createItem(data: z.infer<typeof itemSchema>) {
  const supabase = createClient()
  const { data: brand } = await supabase.from("brands").select("slug").eq("id", data.brand_id).single()
  if (!brand) return { success: false, message: "Brand not found." }

  const { error } = await supabase.from("items").insert(data)
  if (error) return { success: false, message: error.message }
  revalidate(brand.slug)
  return { success: true }
}

export async function updateItem(
  id: string,
  data: Omit<z.infer<typeof itemSchema>, "section_id" | "brand_id" | "position">,
) {
  const supabase = createClient()
  const { data: item } = await supabase.from("items").select("brands(slug)").eq("id", id).single()
  if (!item) return { success: false, message: "Item not found." }

  const { error } = await supabase.from("items").update(data).eq("id", id)
  if (error) return { success: false, message: error.message }
  revalidate(item.brands!.slug)
  return { success: true }
}

export async function deleteItem(id: string) {
  const supabase = createClient()
  const { data: item } = await supabase.from("items").select("brands(slug)").eq("id", id).single()
  if (!item) return { success: false, message: "Item not found." }

  const { error } = await supabase.from("items").delete().eq("id", id)
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
  const supabase = createClient()
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
  const supabase = createClient()
  const { error } = await supabase.from("options").delete().eq("id", id)
  if (error) return { success: false, message: error.message }
  return { success: true }
}

// Form Actions
export async function saveForm(brandId: string, sections: Section[]) {
  const supabase = createClient()

  try {
    // Use a transaction to ensure all or nothing
    const { error: transactionError } = await supabase.rpc("update_form_layout", {
      p_brand_id: brandId,
      p_sections: sections,
    })

    if (transactionError) {
      console.error("Transaction error:", transactionError)
      throw new Error(`Failed to save form layout: ${transactionError.message}`)
    }

    revalidatePath(`/admin/editor/[brandSlug]`, "page")
    revalidatePath(`/forms/[brandSlug]`, "page")

    return { success: true, message: "Form saved successfully!" }
  } catch (error) {
    console.error("Error in saveForm:", error)
    const message = error instanceof Error ? error.message : "An unknown error occurred."
    return { success: false, message }
  }
}
