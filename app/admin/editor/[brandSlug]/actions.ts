"use server"

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const handleError = (error: any, defaultMessage: string) => {
  console.error(error)
  return { success: false, message: error.message || defaultMessage }
}

// --- Section Actions ---
const sectionSchema = z.object({
  title: z.string().min(1),
  brand_id: z.string(),
  position: z.number(),
})

export async function addSection(data: z.infer<typeof sectionSchema>) {
  const supabase = createClient()
  try {
    const { error } = await supabase.from("sections").insert(data)
    if (error) throw error
    revalidatePath("/admin/editor/.*", "layout")
    return { success: true }
  } catch (error) {
    return handleError(error, "Failed to add section.")
  }
}

export async function updateSection(id: string, data: { title: string }) {
  const supabase = createClient()
  try {
    const { error } = await supabase.from("sections").update(data).eq("id", id)
    if (error) throw error
    revalidatePath("/admin/editor/.*", "layout")
    return { success: true }
  } catch (error) {
    return handleError(error, "Failed to update section.")
  }
}

export async function deleteSection(id: string) {
  const supabase = createClient()
  try {
    const { error } = await supabase.from("sections").delete().eq("id", id)
    if (error) throw error
    revalidatePath("/admin/editor/.*", "layout")
    return { success: true }
  } catch (error) {
    return handleError(error, "Failed to delete section.")
  }
}

export async function updateSectionOrder(order: { id: string; position: number }[]) {
  const supabase = createClient()
  try {
    const { error } = await supabase.from("sections").upsert(order)
    if (error) throw error
    revalidatePath("/admin/editor/.*", "layout")
    return { success: true }
  } catch (error) {
    return handleError(error, "Failed to update section order.")
  }
}

// --- Item Actions ---
const itemSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  description: z.string().optional(),
  field_type: z.enum(["text", "textarea", "number", "date", "checkbox", "select", "radio"]),
  placeholder: z.string().optional(),
  is_required: z.boolean(),
  section_id: z.string(),
  brand_id: z.string(),
  position: z.number(),
})

export async function addItem(data: z.infer<typeof itemSchema>) {
  const supabase = createClient()
  try {
    const { error } = await supabase.from("items").insert(data)
    if (error) throw error
    revalidatePath("/admin/editor/.*", "layout")
    return { success: true }
  } catch (error) {
    return handleError(error, "Failed to add item.")
  }
}

export async function updateItem(
  id: string,
  data: Omit<z.infer<typeof itemSchema>, "section_id" | "brand_id" | "position">,
) {
  const supabase = createClient()
  try {
    const { error } = await supabase.from("items").update(data).eq("id", id)
    if (error) throw error
    revalidatePath("/admin/editor/.*", "layout")
    return { success: true }
  } catch (error) {
    return handleError(error, "Failed to update item.")
  }
}

export async function deleteItem(id: string) {
  const supabase = createClient()
  try {
    const { error } = await supabase.from("items").delete().eq("id", id)
    if (error) throw error
    revalidatePath("/admin/editor/.*", "layout")
    return { success: true }
  } catch (error) {
    return handleError(error, "Failed to delete item.")
  }
}
