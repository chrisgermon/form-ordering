"use server"

import { createAdminClient } from "@/utils/supabase/server"
import { promises as fs } from "fs"
import path from "path"
import { revalidatePath } from "next/cache"
import type { Brand } from "@/lib/types"
import { nanoid } from "nanoid"
import { put } from "@vercel/blob"
import { scrapeWebsiteForData } from "@/lib/scraping"

async function executeSqlFile(filePath: string): Promise<{ success: boolean; message: string }> {
  try {
    const supabase = createAdminClient()
    const sql = await fs.readFile(path.join(process.cwd(), filePath), "utf8")
    const { error } = await supabase.rpc("execute_sql", { sql_query: sql })
    if (error) throw error
    return { success: true, message: "SQL script executed successfully." }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    console.error(`Error executing ${filePath}:`, errorMessage)
    return { success: false, message: `Failed to execute SQL script: ${errorMessage}` }
  }
}

export async function createAdminTables() {
  return executeSqlFile("scripts/create-admin-tables.sql")
}

export async function initializeDatabase() {
  return executeSqlFile("scripts/create-tables.sql")
}

export async function autoAssignPdfs() {
  return executeSqlFile("scripts/00-create-rpc-function.sql")
}

export async function runSchemaV5Update() {
  return executeSqlFile("scripts/update-schema-v5.sql")
}

export async function forceSchemaReload() {
  return executeSqlFile("scripts/force-schema-reload.sql")
}

export async function runBrandSchemaCorrection() {
  return executeSqlFile("scripts/correct-brands-schema.sql")
}

export async function runPrimaryColorFix() {
  return executeSqlFile("scripts/fix-primary-color-issue.sql")
}

export async function runSubmissionsFKFix() {
  return executeSqlFile("scripts/fix-submissions-fk.sql")
}

export async function fetchBrandData(url: string, brandSlug: string) {
  try {
    const scrapedData = await scrapeWebsiteForData(url)
    let uploadedLogoUrl: string | null = null
    if (scrapedData.logoUrl) {
      uploadedLogoUrl = await uploadLogo(scrapedData.logoUrl, brandSlug)
    }

    return {
      success: true,
      data: {
        name: scrapedData.title,
        logo: uploadedLogoUrl,
        locations: scrapedData.locations.map((loc) => ({ name: loc, address: loc, phone: "" })),
      },
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    return { success: false, error: errorMessage }
  }
}

async function uploadLogo(logoUrl: string, brandSlug: string): Promise<string | null> {
  try {
    const response = await fetch(logoUrl)
    if (!response.ok) {
      console.error(`Failed to fetch logo image: ${response.statusText}`)
      return null
    }
    const imageBlob = await response.blob()
    const originalName = path.basename(new URL(logoUrl).pathname) || `logo-${nanoid(5)}`
    const filename = `logos/${brandSlug}-${Date.now()}-${originalName}`

    const { url: blobUrl } = await put(filename, imageBlob, {
      access: "public",
      contentType: response.headers.get("content-type") || undefined,
    })

    return blobUrl
  } catch (error) {
    console.error("Error uploading logo:", error)
    return null
  }
}

export async function saveBrand(brandData: Omit<Brand, "id" | "created_at" | "updated_at"> & { id?: string }) {
  const supabase = createAdminClient()
  const { id, clinic_locations, ...brandFields } = brandData

  try {
    let savedBrand: Brand

    if (id) {
      const { data, error } = await supabase.from("brands").update(brandFields).eq("id", id).select().single()
      if (error) throw error
      savedBrand = data
    } else {
      const { data, error } = await supabase.from("brands").insert(brandFields).select().single()
      if (error) throw error
      savedBrand = data
    }

    revalidatePath("/admin")
    revalidatePath(`/forms/${savedBrand.slug}`)
    return { success: true, data: savedBrand }
  } catch (error) {
    console.error("Error saving brand:", error)
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    return { success: false, error: `Failed to save brand: ${errorMessage}` }
  }
}

export async function importForm(
  brandId: string,
  brandSlug: string,
  { htmlCode, url }: { htmlCode?: string; url?: string },
) {
  // The AI SDK package was causing build errors and has been removed.
  // This function needs to be reimplemented if AI functionality is desired.
  // For now, it will return a placeholder message.
  console.log("Attempted to import form for brand:", brandId, "from url:", url)
  return {
    success: false,
    message: "Form import feature is temporarily disabled due to a build issue. Please add fields manually.",
  }
}
