"use server"

import { revalidatePath } from "next/cache"
import { createAdminClient } from "@/lib/supabase/admin"
import { brandSchema } from "@/lib/schemas"
import { del } from "@vercel/blob"

export async function createOrUpdateBrand(prevState: any, formData: FormData) {
  const supabase = createAdminClient()
  const validatedFields = brandSchema.safeParse({
    id: formData.get("id") || undefined,
    name: formData.get("name"),
    slug: formData.get("slug"),
    active: formData.get("active") === "on",
    logo_url: formData.get("existing_logo_url"),
  })

  if (!validatedFields.success) {
    return {
      success: false,
      message: "Invalid data provided.",
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }

  const { id, name, slug, active } = validatedFields.data
  let logoUrl = formData.get("existing_logo_url") as string

  const logoFile = formData.get("logo") as File
  if (logoFile && logoFile.size > 0) {
    // Delete old logo if it exists
    if (logoUrl) {
      try {
        await del(logoUrl)
      } catch (e) {
        console.error("Failed to delete old logo, continuing...", e)
      }
    }

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("logos")
      .upload(`${slug}/${logoFile.name}`, logoFile, {
        cacheControl: "3600",
        upsert: true,
      })

    if (uploadError) {
      return { success: false, message: `Storage Error: ${uploadError.message}` }
    }
    const { data: publicUrlData } = supabase.storage.from("logos").getPublicUrl(uploadData.path)
    logoUrl = publicUrlData.publicUrl
  }

  const brandData = { name, slug, active, logo_url: logoUrl }

  if (id) {
    const { error } = await supabase.from("brands").update(brandData).eq("id", id)
    if (error) return { success: false, message: `Update Error: ${error.message}` }
  } else {
    const { error } = await supabase.from("brands").insert(brandData)
    if (error) return { success: false, message: `Insert Error: ${error.message}` }
  }

  revalidatePath("/admin/dashboard")
  return { success: true, message: `Brand ${id ? "updated" : "created"} successfully.` }
}
