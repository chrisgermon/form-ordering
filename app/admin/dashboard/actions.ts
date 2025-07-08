"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"
import { importClinics } from "@/scripts/import-clinics.mjs"
import { readFileSync } from "fs"
import { resolve } from "path"

async function executeSqlFile(filePath: string) {
  const supabase = createAdminClient()
  try {
    const sql = readFileSync(resolve(process.cwd(), filePath), "utf8")
    const { error } = await supabase.rpc("execute_sql", { sql_statement: sql })
    if (error) {
      console.error(`Error executing ${filePath}:`, error)
      throw new Error(`Database operation failed: ${error.message}`)
    }
    console.log(`Successfully executed ${filePath}`)
    revalidatePath("/admin/dashboard")
    return { success: true, message: `Successfully executed ${filePath}` }
  } catch (e: any) {
    return { success: false, message: e.message }
  }
}

export async function initializeDatabase() {
  return executeSqlFile("scripts/create-tables.sql")
}

export async function runSchemaV5Update() {
  return executeSqlFile("scripts/update-schema-v5.sql")
}

export async function runSchemaV13Update() {
  return executeSqlFile("scripts/update-schema-v13.sql")
}

export async function runSchemaV14Update() {
  return executeSqlFile("scripts/update-schema-v14.sql")
}

export async function forceSchemaReload() {
  return executeSqlFile("scripts/force-schema-reload.sql")
}

export async function runClinicImport() {
  "use server"
  console.log("--- Starting Clinic & Logo Import ---")
  const supabase = createAdminClient()
  try {
    const brandsData = await importClinics()
    console.log(`✅ Parsed data for ${Object.keys(brandsData).length} brands.`)

    let updatedCount = 0
    let failedCount = 0

    for (const [brandName, data] of Object.entries(brandsData)) {
      console.log(`Updating brand: "${brandName}"...`)
      const { error } = await supabase
        .from("brands")
        .update({
          logo: data.logo,
          clinic_locations: data.clinics,
          emails: data.emails,
        })
        .eq("name", brandName)

      if (error) {
        failedCount++
        console.error(`❌ Error updating "${brandName}":`, error.message)
      } else {
        updatedCount++
        console.log(`  -> Successfully updated logo, ${data.clinics.length} clinics, and ${data.emails.length} emails.`)
      }
    }

    console.log("--- ✅ Import Script Finished ---")
    console.log(`Successfully updated ${updatedCount} brands.`)
    if (failedCount > 0) {
      console.log(`Failed to update ${failedCount} brands. Please check logs.`)
    }
    revalidatePath("/admin/dashboard")
    return {
      success: true,
      message: `Clinic import complete. Updated ${updatedCount} brands.`,
    }
  } catch (e: any) {
    console.error("--- ❌ An error occurred during the import process ---")
    console.error(e.message)
    return { success: false, message: e.message }
  }
}
