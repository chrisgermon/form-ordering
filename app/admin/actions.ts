"use server"
import { createServerClient } from "@/lib/supabase/server"
import { brandSchema } from "@/lib/schemas"
import { revalidatePath } from "next/cache"
import { v4 as uuidv4 } from "uuid"
import { createAdminClient } from "@/lib/supabase/admin"

export async function createOrUpdateBrand(formData: FormData) {
  const supabase = createServerClient()
  const supabaseAdmin = createAdminClient()

  const rawData = {
    id: formData.get("id") || undefined,
    name: formData.get("name"),
    slug: formData.get("slug"),
    logo_path: formData.get("logo_path"),
  }

  const validatedFields = brandSchema.safeParse(rawData)

  if (!validatedFields.success) {
    return {
      success: false,
      message: "Invalid form data. Please check your inputs.",
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }

  const { id, name, slug } = validatedFields.data
  let logoPath = validatedFields.data.logo_path

  const logoFile = formData.get("logoFile") as File | null

  if (logoFile && logoFile.size > 0) {
    const filePath = `public/${slug}-${uuidv4()}-${logoFile.name}`
    const { error: uploadError } = await supabaseAdmin.storage.from("logos").upload(filePath, logoFile)

    if (uploadError) {
      return {
        success: false,
        message: `Failed to upload logo: ${uploadError.message}`,
      }
    }

    const { data: urlData } = supabaseAdmin.storage.from("logos").getPublicUrl(filePath)
    logoPath = urlData.publicUrl
  }

  const dataToUpsert = {
    id: id || undefined,
    name,
    slug,
    logo_path: logoPath,
  }

  const { data, error } = await supabase.from("brands").upsert(dataToUpsert).select().single()

  if (error) {
    return {
      success: false,
      message: `Database error: ${error.message}`,
    }
  }

  revalidatePath("/admin/dashboard")
  return {
    success: true,
    message: `Brand ${id ? "updated" : "created"} successfully.`,
    data,
  }
}
