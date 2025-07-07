"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import type { Brand } from "@/lib/types"

const BrandActionSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Brand name is required"),
  slug: z.string().min(1, "Slug is required"),
  is_active: z.enum(["true", "false"]).transform((val) => val === "true"),
})

export async function createOrUpdateBrand(formData: FormData) {
  const supabase = createClient()
  const rawData = {
    id: formData.get("id"),
    name: formData.get("name"),
    slug: formData.get("slug"),
    is_active: formData.get("is_active"),
  }
  const logoFile = formData.get("logo") as File | null

  const validatedFields = BrandActionSchema.safeParse(rawData)
  if (!validatedFields.success) {
    return { error: "Invalid data provided." }
  }

  const { id, ...brandData } = validatedFields.data
  let logo_url: string | undefined = undefined

  if (logoFile && logoFile.size > 0) {
    const filePath = `public/${validatedFields.data.slug}-${Date.now()}-${logoFile.name}`
    const { error: uploadError } = await supabase.storage.from("brand-assets").upload(filePath, logoFile)

    if (uploadError) {
      console.error("Logo upload error:", uploadError)
      return { error: "Failed to upload logo." }
    }

    const { data: urlData } = supabase.storage.from("brand-assets").getPublicUrl(filePath)
    logo_url = urlData.publicUrl
  }

  try {
    if (id) {
      // Update
      const updatePayload: Partial<Brand> = { ...brandData }
      if (logo_url) {
        updatePayload.logo_url = logo_url
      }
      const { error } = await supabase.from("brands").update(updatePayload).eq("id", id)
      if (error) throw error
    } else {
      // Create
      const createPayload: Omit<Brand, "id" | "created_at"> = {
        ...brandData,
        logo_url: logo_url || null,
      }
      const { error } = await supabase.from("brands").insert([createPayload])
      if (error) throw error
    }

    revalidatePath("/admin/dashboard")
    return { success: true }
  } catch (error) {
    console.error("Brand save error:", error)
    return { error: "Database error: Failed to save brand." }
  }
}

export async function getBrands(): Promise<Brand[]> {
  const supabase = createClient()
  const { data, error } = await supabase.from("brands").select("*").order("name")
  if (error) {
    console.error("Error fetching brands:", error)
    return []
  }
  return data
}
