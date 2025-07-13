"use server"

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"
import { del, put } from "@vercel/blob"
import { z } from "zod"

const BrandSchema = z.object({
  name: z.string().min(1, "Brand name is required"),
  slug: z.string().min(1, "Slug is required"),
  active: z.boolean(),
  emails: z.array(z.string().email()),
  clinic_locations: z.array(
    z.object({
      name: z.string().min(1),
      address: z.string().min(1),
      phone: z.string().optional().or(z.literal("")),
      email: z.string().email().optional().or(z.literal("")),
    }),
  ),
})

async function handleLogoUpload(logoFile: File | null, currentLogoUrl: string | null | undefined) {
  if (logoFile && logoFile.size > 0) {
    if (currentLogoUrl) {
      try {
        if (currentLogoUrl.includes("blob.vercel-storage.com")) {
          await del(currentLogoUrl)
        }
      } catch (error) {
        console.error("Failed to delete old logo, it might not exist:", error)
      }
    }
    const blob = await put(`logos/${Date.now()}-${logoFile.name}`, logoFile, {
      access: "public",
    })
    return blob.url
  }
  return currentLogoUrl
}

const toBoolean = (value: string | null) => value === "true"

export async function createBrand(prevState: any, formData: FormData) {
  const supabase = createClient()

  const validatedFields = BrandSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    active: toBoolean(formData.get("active") as string),
    emails: JSON.parse((formData.get("emails") as string) || "[]"),
    clinic_locations: JSON.parse((formData.get("clinic_locations") as string) || "[]"),
  })

  if (!validatedFields.success) {
    return {
      message: "Invalid form data.",
      errors: validatedFields.error.flatten().fieldErrors,
      success: false,
    }
  }

  const logoFile = formData.get("logo") as File | null
  const logoUrl = await handleLogoUpload(logoFile, null)

  const { error } = await supabase.from("brands").insert({
    ...validatedFields.data,
    logo: logoUrl,
  })

  if (error) {
    return { message: `Database Error: ${error.message}`, success: false }
  }

  revalidatePath("/admin")
  return { message: "Brand created successfully.", success: true }
}

export async function updateBrand(id: number, prevState: any, formData: FormData) {
  const supabase = createClient()

  const validatedFields = BrandSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    active: toBoolean(formData.get("active") as string),
    emails: JSON.parse((formData.get("emails") as string) || "[]"),
    clinic_locations: JSON.parse((formData.get("clinic_locations") as string) || "[]"),
  })

  if (!validatedFields.success) {
    return {
      message: "Invalid form data.",
      errors: validatedFields.error.flatten().fieldErrors,
      success: false,
    }
  }

  const { data: currentBrand } = await supabase.from("brands").select("logo").eq("id", id).single()
  const logoFile = formData.get("logo") as File | null
  const logoUrl = await handleLogoUpload(logoFile, currentBrand?.logo)

  const { error } = await supabase
    .from("brands")
    .update({ ...validatedFields.data, logo: logoUrl })
    .eq("id", id)

  if (error) {
    return { message: `Database Error: ${error.message}`, success: false }
  }

  revalidatePath("/admin")
  revalidatePath(`/forms/${validatedFields.data.slug}`)
  return { message: "Brand updated successfully.", success: true }
}

export async function deleteBrand(brandId: number) {
  const supabase = createClient()
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
  console.log(`Importing form for brand ${brandId}`, sections)
  return { success: true, message: "Form imported successfully (placeholder)." }
}

export async function clearFormForBrand(brandId: number) {
  const supabase = createClient()
  console.log(`Clearing form for brand ${brandId}`)
  return { success: true, message: "Form cleared successfully (placeholder)." }
}

export async function revalidateAllData() {
  revalidatePath("/", "layout")
  return { success: true }
}

export async function fetchBrandData(slug: string) {
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
