"use server"

import seedDatabase from "@/lib/seed-database"
import { revalidatePath } from "next/cache"
import { createServerSupabaseClient } from "@/lib/supabase"

export async function runSeed() {
  try {
    await seedDatabase()
    revalidatePath("/")
    revalidatePath("/admin")
    return { success: true, message: "Database seeded successfully!" }
  } catch (error) {
    console.error("Error seeding database:", error)
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred."
    return { success: false, message: `Failed to seed database: ${errorMessage}` }
  }
}

export async function autoAssignPdfs() {
  try {
    const supabase = createServerSupabaseClient()

    const { data: files, error: filesError } = await supabase
      .from("uploaded_files")
      .select("id, original_name, url")
      .ilike("original_name", "%.pdf") // Only get PDF files

    if (filesError) throw filesError

    const { data: items, error: itemsError } = await supabase.from("product_items").select("id, code")
    if (itemsError) throw itemsError

    const itemCodeMap = new Map(items.map((item) => [item.code.toUpperCase(), item.id]))
    const updatePromises = []
    let updatedCount = 0
    const unmatchedFiles = []

    for (const file of files) {
      const fileCode = file.original_name.replace(/\.pdf$/i, "").toUpperCase()
      if (itemCodeMap.has(fileCode)) {
        const itemId = itemCodeMap.get(fileCode)
        updatePromises.push(supabase.from("product_items").update({ sample_link: file.url }).eq("id", itemId))
        updatedCount++
      } else {
        unmatchedFiles.push(file.original_name)
      }
    }

    if (updatePromises.length > 0) {
      const results = await Promise.all(updatePromises)
      const dbError = results.find((res) => res.error)
      if (dbError) throw dbError.error
    }

    revalidatePath("/admin", "layout")
    revalidatePath("/forms", "layout")

    let message = `${updatedCount} PDF(s) were successfully assigned.`
    if (unmatchedFiles.length > 0) {
      message += ` The following files could not be matched: ${unmatchedFiles.join(", ")}.`
    }
    if (updatedCount === 0 && unmatchedFiles.length === 0) {
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
  try {
    const supabase = createServerSupabaseClient()
    // This calls the PostgreSQL function we created in the new SQL script.
    const { error } = await supabase.rpc("reload_schema_cache")

    if (error) throw error

    return { success: true, message: "Schema cache reloaded successfully!" }
  } catch (error) {
    console.error("Error reloading schema cache:", error)
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred."
    return { success: false, message: `Failed to reload schema: ${errorMessage}` }
  }
}
