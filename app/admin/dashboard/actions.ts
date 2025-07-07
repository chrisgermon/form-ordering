"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"
import { seedDatabase as seed } from "@/lib/seed-database"

async function runDbMigration(fileName: string) {
  try {
    const supabase = createAdminClient()

    // In this environment, we can't use 'fs'. We fetch the migration file instead.
    // This relies on the preview environment making project files available via fetch.
    const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"
    const fileUrl = new URL(`/scripts/${fileName}`, baseUrl)

    const response = await fetch(fileUrl)

    if (!response.ok) {
      throw new Error(`Failed to fetch migration file ${fileName}: ${response.status} ${response.statusText}`)
    }

    const sql = await response.text()

    const { error } = await supabase.rpc("execute_sql", { sql_query: sql })
    if (error) {
      console.error(`Error running migration ${fileName}:`, error)
      throw new Error(`Migration ${fileName} failed: ${error.message}`)
    }
    return { success: true, message: `Migration ${fileName} completed successfully.` }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred."
    return { success: false, message: errorMessage }
  }
}

export async function runSchemaV2Update() {
  return runDbMigration("update-schema-v2.sql")
}
export async function runSchemaV3Update() {
  return runDbMigration("update-schema-v3.sql")
}
export async function runSchemaV4Update() {
  return runDbMigration("update-schema-v4.sql")
}
export async function runSchemaV5Update() {
  return runDbMigration("update-schema-v5.sql")
}
export async function runSchemaV6Update() {
  return runDbMigration("update-schema-v6.sql")
}
export async function runSchemaV7Update() {
  return runDbMigration("update-schema-v7.sql")
}
export async function runSchemaV8Update() {
  return runDbMigration("update-schema-v8.sql")
}
export async function runSchemaV9Update() {
  return runDbMigration("update-schema-v9.sql")
}
export async function runSchemaV10Update() {
  return runDbMigration("update-schema-v10.sql")
}
export async function runSchemaV11Update() {
  return runDbMigration("update-schema-v11.sql")
}
export async function runSchemaV12Update() {
  return runDbMigration("update-schema-v12.sql")
}
export async function runSchemaV13Update() {
  return runDbMigration("update-schema-v13.sql")
}
export async function runSchemaV14Update() {
  return runDbMigration("update-schema-v14.sql")
}
export async function runSchemaV15Update() {
  return runDbMigration("update-schema-v15.sql")
}
export async function runSchemaV16Update() {
  return runDbMigration("update-schema-v16.sql")
}
export async function runSchemaV21Update() {
  return runDbMigration("update-schema-v21.sql")
}

export async function forceSchemaReload() {
  return runDbMigration("force-schema-reload.sql")
}

export async function seedDatabase() {
  try {
    await seed()
    revalidatePath("/admin/dashboard")
    return { success: true, message: "Database seeded successfully." }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred."
    return { success: false, message: `Database seeding failed: ${errorMessage}` }
  }
}
