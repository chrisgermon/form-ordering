"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"
import { readFileSync } from "fs"
import { resolve } from "path"
import { seedDatabase as seedDb } from "@/lib/seed-database"

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
    return { success: false, error: e.message }
  }
}

export async function runSchemaV15Update() {
  return executeSqlFile("scripts/update-schema-v15.sql")
}

export async function runSchemaV14Update() {
  return executeSqlFile("scripts/update-schema-v14.sql")
}

export async function runSchemaV13Update() {
  return executeSqlFile("scripts/update-schema-v13.sql")
}

export async function forceSchemaReload() {
  return executeSqlFile("scripts/force-schema-reload.sql")
}

export async function seedDatabase() {
  try {
    await seedDb()
    revalidatePath("/")
    revalidatePath("/admin/dashboard")
    return { success: true, message: "Database seeded successfully." }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}
