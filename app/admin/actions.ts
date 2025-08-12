"use server"

import { revalidatePath } from "next/cache"
import { createServerSupabaseClient } from "@/lib/supabase"
import { seedData } from "@/lib/seed-data"
import type { Brand } from "@/lib/types"

export async function seedDatabase() {
  const supabase = createServerSupabaseClient()
  try {
    await seedData(supabase)
    revalidatePath("/admin")
    return { success: true, message: "Database seeded successfully." }
  } catch (error) {
    console.error("Error seeding database:", error)
    return { success: false, message: `Failed to seed database: ${error.message}` }
  }
}

export async function deleteBrand(brandId: string) {
  const supabase = createServerSupabaseClient()
  const { error } = await supabase.from("brands").delete().match({ id: brandId })

  if (error) {
    console.error("Error deleting brand:", error)
    return { success: false, message: `Failed to delete brand: ${error.message}` }
  }

  revalidatePath("/admin")
  return { success: true, message: "Brand deleted successfully." }
}

export async function updateBrand(brand: Partial<Brand>) {
  const supabase = createServerSupabaseClient()
  const { id, ...updateData } = brand
  const { error } = await supabase.from("brands").update(updateData).match({ id })

  if (error) {
    console.error("Error updating brand:", error)
    return { success: false, message: `Failed to update brand: ${error.message}` }
  }

  revalidatePath("/admin")
  revalidatePath(`/admin/editor/${brand.slug}`)
  return { success: true, message: "Brand updated successfully." }
}
