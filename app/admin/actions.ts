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
    const { data: items, error: itemsError } = await supabase.from("product_items").select("id, code")
    if (itemsError) throw itemsError

    const { data: files, error: filesError } = await supabase.from("uploaded_files").select("id, original_name, url")
    if (filesError) throw filesError

    let assignments = 0
    const unmatchedFiles: string[] = []

    const itemCodeMap = new Map(items.map((item) => [item.code.toUpperCase(), item.id]))

    for (const file of files) {
      const fileCode = file.original_name.replace(/\.pdf$/i, "").toUpperCase()
      if (itemCodeMap.has(fileCode)) {
        const itemId = itemCodeMap.get(fileCode)
        const { error: updateError } = await supabase
          .from("product_items")
          .update({ sample_link: file.url })
          .eq("id", itemId)

        if (updateError) {
          console.error(`Failed to update item ${fileCode}:`, updateError.message)
        } else {
          assignments++
        }
      } else {
        unmatchedFiles.push(file.original_name)
      }
    }

    revalidatePath("/admin", "layout")
    revalidatePath("/forms", "layout")

    let message = `${assignments} PDF(s) were successfully assigned.`
    if (unmatchedFiles.length > 0) {
      message += ` The following files could not be matched: ${unmatchedFiles.join(", ")}.`
    }
    if (assignments === 0 && unmatchedFiles.length === 0) {
      message = "No new PDFs found to assign."
    }

    return { success: true, message }
  } catch (error) {
    console.error("Error auto-assigning PDFs:", error)
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred."
    return { success: false, message: `Failed to assign PDFs: ${errorMessage}` }
  }
}

export async function reloadSchemaCache() {
  const supabase = createServerSupabaseClient()
  try {
    // This RPC call will trigger the PostgREST schema cache reload.
    // The name now correctly matches the function in the database.
    const { error } = await supabase.rpc("reload_schema_cache")
    if (error) {
      throw error
    }
    revalidatePath("/admin")
    return { success: true, message: "Schema cache reloaded successfully." }
  } catch (error) {
    console.error("Error reloading schema cache:", error)
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred."
    return { success: false, message: `Failed to reload schema cache: ${errorMessage}` }
  }
}
