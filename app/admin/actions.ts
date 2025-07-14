"use server"

import { seedDatabase } from "@/lib/seed-database"
import { createServerSupabaseClient } from "@/lib/supabase"
import { revalidatePath } from "next/cache"

export async function runSeed() {
  try {
    await seedDatabase()
    revalidatePath("/admin")
    return { success: true, message: "Database seeded successfully!" }
  } catch (error) {
    console.error("Seeding failed:", error)
    return { success: false, message: `Seeding failed: ${error instanceof Error ? error.message : "Unknown error"}` }
  }
}

export async function autoAssignPdfs() {
  const supabase = createServerSupabaseClient()
  try {
    const { data: items, error: itemsError } = await supabase.from("items").select("id, code")
    if (itemsError) throw itemsError

    const { data: files, error: filesError } = await supabase.from("uploaded_files").select("id, original_name, url")
    if (filesError) throw filesError

    let assignments = 0
    for (const item of items) {
      const matchingFile = files.find((file) => {
        const fileNameWithoutExt = file.original_name.split(".").slice(0, -1).join(".")
        return fileNameWithoutExt.toUpperCase() === item.code.toUpperCase()
      })

      if (matchingFile) {
        const { error: updateError } = await supabase
          .from("items")
          .update({ pdf_url: matchingFile.url })
          .eq("id", item.id)

        if (updateError) {
          console.error(`Failed to update item ${item.code}:`, updateError.message)
        } else {
          assignments++
        }
      }
    }
    revalidatePath("/admin")
    return { message: `Auto-assignment complete. ${assignments} PDFs linked to items.` }
  } catch (error) {
    return { message: `An error occurred: ${error instanceof Error ? error.message : "Unknown error"}` }
  }
}

export async function reloadSchemaCache() {
  const supabase = createServerSupabaseClient()
  try {
    // This RPC call will trigger the PostgREST schema cache reload
    const { error } = await supabase.rpc("reload_schema")
    if (error) {
      throw error
    }
    return { message: "Schema cache reloaded successfully." }
  } catch (error) {
    console.error("Error reloading schema cache:", error)
    return { message: `Failed to reload schema cache: ${error instanceof Error ? error.message : "Unknown error"}` }
  }
}
