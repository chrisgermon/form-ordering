"use server"

import { createAdminClient } from "@/utils/supabase/server"
import { promises as fs } from "fs"
import path from "path"
import { revalidatePath } from "next/cache"
import type { Brand } from "@/lib/types"
import { nanoid } from "nanoid"
import { put } from "@vercel/blob"
import { scrapeWebsiteForData } from "@/lib/scraping"
import * as cheerio from "cheerio"

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
  if (!process.env.XAI_API_KEY) {
    return { success: false, message: "AI service is not configured on the server." }
  }

  let finalHtmlCode = htmlCode
  if (url) {
    try {
      const response = await fetch(url)
      if (!response.ok) {
        return { success: false, message: `Failed to fetch URL. Status: ${response.status}` }
      }
      finalHtmlCode = await response.text()
    } catch (error) {
      return { success: false, message: "Invalid or unreachable URL." }
    }
  }

  if (!finalHtmlCode) {
    return { success: false, message: "Please provide either a URL or HTML code." }
  }

  try {
    const supabase = createAdminClient()
    const $ = cheerio.load(finalHtmlCode)

    // Clean up the HTML to send less data to the AI
    $("script, style, nav, header, footer, img, svg").remove()
    const formHtml = $("form").length ? $("form").html() : $("body").html()
    const cleanHtml = (formHtml || "").replace(/\s\s+/g, " ").trim()

    if (!cleanHtml) {
      return {
        success: false,
        message: "AI could not find any form fields to import. Please check the source code or URL.",
      }
    }

    // Now, save to database
    const { count: existingSectionsCount } = await supabase
      .from("product_sections")
      .select("sort_order", { count: "exact", head: true })
      .eq("brand_id", brandId)

    let sectionSortOrder = existingSectionsCount || 0

    for (const section of cleanHtml) {
      const { data: newSection, error: sectionError } = await supabase
        .from("product_sections")
        .insert({
          title: section.title,
          brand_id: brandId,
          sort_order: sectionSortOrder++,
        })
        .select()
        .single()

      if (sectionError) throw sectionError

      const itemsToInsert = section.items.map((item, index) => ({
        ...item,
        brand_id: brandId,
        section_id: newSection.id,
        sort_order: index,
      }))

      if (itemsToInsert.length > 0) {
        const { error: itemsError } = await supabase.from("product_items").insert(itemsToInsert)
        if (itemsError) throw itemsError
      }
    }

    revalidatePath(`/admin/editor/${brandSlug}`)
    revalidatePath(`/forms/${brandSlug}`)
    return {
      success: true,
      message: `Successfully imported ${cleanHtml.reduce((acc, s) => acc + s.items.length, 0)} fields.`,
    }
  } catch (error) {
    console.error("Form import error:", error)
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during import."
    return { success: false, message: `Import failed: ${errorMessage}` }
  }
}
