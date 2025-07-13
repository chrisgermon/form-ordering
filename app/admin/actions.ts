"use server"

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"
import { del, put } from "@vercel/blob"
import type { Brand } from "@/lib/types"
import { z } from "zod"

const BrandSchema = z.object({
  name: z.string().min(1, "Brand name is required"),
  slug: z.string().min(1, "Slug is required"),
  active: z.boolean(),
  emails: z.array(z.string().email()),
  clinic_locations: z
    .array(
      z.object({
        name: z.string(),
        address: z.string(),
        phone: z.string().optional().nullable(),
        email: z.string().optional().nullable(),
      }),
    )
    .optional(),
})

async function handleLogoUpload(logoFile: File | null, currentLogoUrl: string | null | undefined) {
  if (logoFile && logoFile.size > 0) {
    if (currentLogoUrl) {
      try {
        await del(currentLogoUrl)
      } catch (error) {
        console.error("Failed to delete old logo, it might not exist:", error)
      }
    }
    const blob = await put(`logos/${logoFile.name}`, logoFile, {
      access: "public",
    })
    return blob.url
  }
  return currentLogoUrl
}

export async function createBrand(prevState: any, formData: FormData) {
  const supabase = createClient()

  const validatedFields = BrandSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    active: formData.get("active") === "true",
    emails: JSON.parse((formData.get("emails") as string) || "[]"),
    clinic_locations: JSON.parse((formData.get("clinic_locations") as string) || "[]"),
  })

  if (!validatedFields.success) {
    return {
      message: "Invalid form data.",
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }

  const logoFile = formData.get("logo") as File | null
  const logoUrl = await handleLogoUpload(logoFile, null)

  const { error } = await supabase.from("brands").insert({
    ...validatedFields.data,
    logo: logoUrl,
  })

  if (error) {
    return { message: `Database Error: ${error.message}` }
  }

  revalidatePath("/admin")
  return { message: "Brand created successfully.", success: true }
}

export async function updateBrand(id: string, prevState: any, formData: FormData) {
  const supabase = createClient()

  const validatedFields = BrandSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    active: formData.get("active") === "true",
    emails: JSON.parse((formData.get("emails") as string) || "[]"),
    clinic_locations: JSON.parse((formData.get("clinic_locations") as string) || "[]"),
  })

  if (!validatedFields.success) {
    return {
      message: "Invalid form data.",
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }

  const numericId = Number.parseInt(id, 10)
  if (isNaN(numericId)) {
    return { message: "Invalid Brand ID." }
  }

  const { data: currentBrand } = await supabase.from("brands").select("logo").eq("id", numericId).single()
  const logoFile = formData.get("logo") as File | null
  const logoUrl = await handleLogoUpload(logoFile, currentBrand?.logo)

  const { error } = await supabase
    .from("brands")
    .update({ ...validatedFields.data, logo: logoUrl })
    .eq("id", numericId)

  if (error) {
    return { message: `Database Error: ${error.message}` }
  }

  revalidatePath("/admin")
  revalidatePath(`/forms/${validatedFields.data.slug}`)
  return { message: "Brand updated successfully.", success: true }
}

export async function deleteBrand(brandId: number) {
  const supabase = createClient()
  if (isNaN(brandId)) {
    return { success: false, message: "Invalid Brand ID." }
  }
  const { error } = await supabase.from("brands").delete().eq("id", brandId)
  if (error) {
    return { success: false, message: error.message }
  }
  revalidatePath("/admin")
  return { success: true, message: "Brand deleted successfully." }
}

export async function deleteFile(fileUrl: string) {
  const supabase = createClient()
  try {
    await del(fileUrl)
    const { error } = await supabase.from("files").delete().eq("url", fileUrl)
    if (error) throw error
    revalidatePath("/admin")
    return { success: true, message: "File deleted successfully." }
  } catch (error: any) {
    return { success: false, message: error.message }
  }
}

export async function importForm(brandId: number, sections: any[]) {
  const supabase = createClient()
  // Implementation for importing form sections and items
  // This is a placeholder implementation
  console.log(`Importing form for brand ${brandId}`, sections)
  return { success: true, message: "Form imported successfully (placeholder)." }
}

export async function clearFormForBrand(brandId: number) {
  const supabase = createClient()
  // Implementation for clearing form sections and items for a brand
  // This is a placeholder implementation
  console.log(`Clearing form for brand ${brandId}`)
  return { success: true, message: "Form cleared successfully (placeholder)." }
}

export async function revalidateAllData() {
  revalidatePath("/", "layout")
  return { success: true }
}

export async function fetchBrandData(slug: string): Promise<Brand | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("brands")
    .select(`*, sections(*, items(*, options(*)))`)
    .eq("slug", slug)
    .single()

  if (error) {
    console.error(`Error fetching brand data for slug ${slug}:`, error)
    return null
  }
  return data
}
