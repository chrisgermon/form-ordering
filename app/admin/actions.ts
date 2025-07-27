"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { seedData } from "@/lib/seed-data"

export async function seedDatabase() {
  const supabase = createClient()
  try {
    await seedData(supabase)
    revalidatePath("/")
    revalidatePath("/admin")
    return { success: true, message: "Database seeded successfully." }
  } catch (error) {
    console.error("Error seeding database:", error)
    return { success: false, message: "Failed to seed database." }
  }
}

export async function createBrand(formData: FormData) {
  const supabase = createClient()
  const name = formData.get("name") as string
  const slug = formData.get("slug") as string
  const logo_url = formData.get("logo_url") as string
  const clinics = JSON.parse((formData.get("clinics") as string) || "[]")

  const { error } = await supabase.from("brands").insert([{ name, slug, logo_url, clinics }])

  if (error) {
    console.error("Error creating brand:", error)
    return { success: false, message: "Failed to create brand." }
  }

  revalidatePath("/admin")
  return { success: true, message: "Brand created successfully." }
}

export async function updateBrand(formData: FormData) {
  const supabase = createClient()
  const id = formData.get("id") as string
  const name = formData.get("name") as string
  const slug = formData.get("slug") as string
  const logo_url = formData.get("logo_url") as string
  const clinics = JSON.parse((formData.get("clinics") as string) || "[]")

  const { error } = await supabase.from("brands").update({ name, slug, logo_url, clinics }).eq("id", id)

  if (error) {
    console.error("Error updating brand:", error)
    return { success: false, message: "Failed to update brand." }
  }

  revalidatePath("/admin")
  revalidatePath(`/admin/editor/${slug}`)
  return { success: true, message: "Brand updated successfully." }
}

export async function deleteBrand(id: string) {
  const supabase = createClient()

  const { error } = await supabase.from("brands").delete().eq("id", id)

  if (error) {
    console.error("Error deleting brand:", error)
    return { success: false, message: "Failed to delete brand." }
  }

  revalidatePath("/admin")
  return { success: true, message: "Brand deleted successfully." }
}
