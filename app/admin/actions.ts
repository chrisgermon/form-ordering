"use server"

import { revalidatePath } from "next/cache"
import { createAdminClient } from "@/lib/supabase/admin"
import { z } from "zod"
import { put, del } from "@vercel/blob"

const brandSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Brand name is required."),
  slug: z.string().min(1, "Brand slug is required."),
  active: z.boolean(),
  logo: z.instanceof(File).optional(),
  existing_logo_url: z.string().url().optional().or(z.literal("")),
})

export async function updateBrand(prevState: any, formData: FormData) {
  const supabase = createAdminClient()

  const validatedFields = brandSchema.safeParse({
    id: formData.get("id") as string | undefined,
    name: formData.get("name") as string,
    slug: formData.get("slug") as string,
    active: formData.get("active") === "on",
    logo: formData.get("logo") as File,
    existing_logo_url: formData.get("existing_logo_url") as string,
  })

  if (!validatedFields.success) {
    return {
      success: false,
      message: "Invalid data provided.",
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }

  const { id, name, slug, active, logo, existing_logo_url } = validatedFields.data
  let logoUrl = existing_logo_url || null

  // If a new logo is uploaded, upload it and update the URL.
  if (logo && logo.size > 0) {
    try {
      // If there was an old logo, delete it from blob storage
      if (existing_logo_url) {
        await del(existing_logo_url)
      }
      const blob = await put(`${slug}-logo-${logo.name}`, logo, { access: "public" })
      logoUrl = blob.url
    } catch (error) {
      console.error("Error uploading logo:", error)
      return { success: false, message: "Failed to upload logo." }
    }
  }

  const brandData = {
    name,
    slug,
    active,
    logo_url: logoUrl,
  }

  if (id) {
    // Update existing brand
    const { error } = await supabase.from("brands").update(brandData).eq("id", id)
    if (error) {
      console.error("Error updating brand:", error)
      return { success: false, message: `Database error: ${error.message}` }
    }
  } else {
    // Create new brand
    const { error } = await supabase.from("brands").insert(brandData)
    if (error) {
      console.error("Error creating brand:", error)
      return { success: false, message: `Database error: ${error.message}` }
    }
  }

  revalidatePath("/admin/dashboard")
  revalidatePath("/")
  return { success: true, message: id ? "Brand updated successfully!" : "Brand created successfully!" }
}
