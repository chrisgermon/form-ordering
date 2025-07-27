"use server"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import slugify from "slugify"
import type { BrandType, UploadedFileType } from "@/lib/types"

export async function saveBrand(brandData: BrandType) {
  const supabase = createServerSupabaseClient()
  const { id, name, logo, primary_color, email, active, clinics } = brandData

  const slug = slugify(name, { lower: true, strict: true })

  const dataToUpsert = {
    id,
    name,
    slug,
    logo,
    primary_color,
    email,
    active,
    clinics,
  }

  if (!dataToUpsert.id) {
    delete (dataToUpsert as Partial<typeof dataToUpsert>).id
  }

  const { error } = await supabase.from("brands").upsert(dataToUpsert).select()

  if (error) {
    console.error("Error saving brand:", error)
    throw new Error(error.message)
  }

  revalidatePath("/admin")
  revalidatePath("/")
}

export async function uploadFile(formData: FormData) {
  const file = formData.get("file") as File
  if (!file) {
    throw new Error("No file provided")
  }

  const supabase = createServerSupabaseClient()
  const filePath = `public/${file.name}`

  const { error: uploadError } = await supabase.storage.from("logos").upload(filePath, file, {
    cacheControl: "3600",
    upsert: true,
  })

  if (uploadError) {
    console.error("Error uploading file to storage:", uploadError)
    throw new Error(uploadError.message)
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("logos").getPublicUrl(filePath)

  const { data, error: dbError } = await supabase
    .from("uploaded_files")
    .insert({
      original_name: file.name,
      storage_path: filePath,
      url: publicUrl,
    })
    .select()
    .single()

  if (dbError) {
    console.error("Error saving file metadata to DB:", dbError)
    throw new Error(dbError.message)
  }

  revalidatePath("/admin")
  return data as UploadedFileType
}
