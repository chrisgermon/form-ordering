"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { seedData } from "@/lib/seed-data"

export async function seedDatabase() {
  const supabase = createClient()

  console.log("Seeding data...")
  await supabase.from("brands").delete().neq("id", 0)
  await supabase.from("sections").delete().neq("id", 0)
  await supabase.from("items").delete().neq("id", 0)

  const { brands, sections, items } = seedData

  const { data: seededBrands, error: brandsError } = await supabase.from("brands").insert(brands).select()
  if (brandsError) {
    console.error("Error seeding brands:", brandsError)
    return { success: false, error: brandsError.message }
  }

  const { error: sectionsError } = await supabase.from("sections").insert(sections)
  if (sectionsError) {
    console.error("Error seeding sections:", sectionsError)
    return { success: false, error: sectionsError.message }
  }

  const { error: itemsError } = await supabase.from("items").insert(items)
  if (itemsError) {
    console.error("Error seeding items:", itemsError)
    return { success: false, error: itemsError.message }
  }

  console.log("Seeding complete.")
  revalidatePath("/admin")
  return { success: true }
}

export async function createBrand(formData: FormData) {
  const supabase = createClient()
  const name = formData.get("name") as string
  const slug = formData.get("slug") as string
  const logo_path = formData.get("logo_path") as string
  const clinics = JSON.parse((formData.get("clinics") as string) || "[]")

  const { data, error } = await supabase.from("brands").insert([{ name, slug, logo_path, clinics }]).select().single()

  if (error) {
    console.error("Error creating brand:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/admin")
  if (data?.slug) {
    revalidatePath(`/admin/editor/${data.slug}`)
  }
  return { success: true, brand: data }
}

export async function updateBrand(formData: FormData) {
  const supabase = createClient()
  const id = formData.get("id") as string
  const name = formData.get("name") as string
  const slug = formData.get("slug") as string
  const logo_path = formData.get("logo_path") as string
  const clinics = JSON.parse((formData.get("clinics") as string) || "[]")

  const { data, error } = await supabase
    .from("brands")
    .update({ name, slug, logo_path, clinics })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error("Error updating brand:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/admin")
  if (data?.slug) {
    revalidatePath(`/admin/editor/${data.slug}`)
  }
  return { success: true, brand: data }
}

export async function deleteBrand(id: number) {
  const supabase = createClient()

  const { error } = await supabase.from("brands").delete().eq("id", id)

  if (error) {
    console.error("Error deleting brand:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/admin")
  return { success: true }
}
