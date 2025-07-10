"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"
import { promises as fs } from "fs"
import path from "path"
import { seedDatabase as seed } from "@/lib/seed-database"
import { generateText } from "ai"
import { xai } from "@ai-sdk/openai"

async function runDbMigration(fileName: string) {
  try {
    const supabase = createAdminClient()
    const sql = await fs.readFile(path.join(process.cwd(), "scripts", fileName), "utf8")
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
export async function runSchemaV17Update() {
  return runDbMigration("update-schema-v17.sql")
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

export async function runCodeAssessment() {
  try {
    const supabase = createAdminClient()
    const filesToAssess = [
      "app/api/submit-order/route.ts",
      "components/order-form.tsx",
      "lib/db.ts",
      "app/admin/dashboard/page.tsx",
    ]

    let combinedCode = ""
    for (const filePath of filesToAssess) {
      try {
        const fullPath = path.join(process.cwd(), filePath)
        const content = await fs.readFile(fullPath, "utf8")
        combinedCode += `--- FILE: ${filePath} ---\n\n${content}\n\n`
      } catch (fsError) {
        console.warn(`Could not read file ${filePath}:`, fsError)
        // Continue even if one file is missing
      }
    }

    if (!combinedCode) {
      return { success: false, message: "Could not read any files to assess." }
    }

    const prompt = `
      As an expert code reviewer specializing in Next.js, Supabase, and React, analyze the following code from a printing order form application. The files are: ${filesToAssess.join(
        ", ",
      )}.

      Provide a powerful and concise assessment covering these four key areas:
      1.  **Potential Bugs:** Identify any logic errors, race conditions, or potential runtime crashes.
      2.  **Performance Optimizations:** Suggest specific improvements for faster load times, more efficient queries, or better rendering performance.
      3.  **Security Vulnerabilities:** Point out any potential security risks, such as data exposure, insecure server actions, or issues with database access.
      4.  **Best Practices & Readability:** Comment on code structure, adherence to modern React/Next.js patterns, and overall maintainability.

      Format your response using Markdown with clear headings for each section. Be specific and provide code snippets where helpful.

      Here is the code:
      ${combinedCode}
    `

    const { text } = await generateText({
      model: xai("grok-3"),
      prompt: prompt,
      maxTokens: 2048,
    })

    return { success: true, assessment: text }
  } catch (error) {
    console.error("Error running code assessment:", error)
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred."
    return { success: false, message: `Code assessment failed: ${errorMessage}` }
  }
}
