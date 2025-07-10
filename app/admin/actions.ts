"use server"

import { createAdminClient } from "@/utils/supabase/server"
import initializeDatabaseFunction from "@/lib/seed-database"
import { promises as fs } from "fs"
import path from "path"
import { revalidatePath } from "next/cache"
import * as cheerio from "cheerio"
import type { ProductItem } from "./editor/[brandSlug]/types"
import { generateObject } from "ai"
import { xai } from "@ai-sdk/xai"
import { z } from "zod"
import type { ClinicLocation } from "@/lib/types"
import { nanoid } from "nanoid"
import { put } from "@vercel/blob"

async function executeSqlFile(filePath: string) {
  const supabase = createAdminClient()
  const sql = await fs.readFile(path.join(process.cwd(), filePath), "utf8")
  const { error } = await supabase.rpc("execute_sql", { sql_query: sql })
  if (error) throw error
}

export async function createAdminTables() {
  try {
    await executeSqlFile("scripts/create-admin-tables.sql")
    return { success: true, message: "Admin tables created successfully!" }
  } catch (error: any) {
    console.error("Error creating admin tables:", error)
    return { success: false, message: `Failed to create admin tables: ${error.message}` }
  }
}

export async function initializeDatabase() {
  try {
    await initializeDatabaseFunction()
    revalidatePath("/admin")
    return { success: true, message: "Database initialized successfully with 5 brands!" }
  } catch (error: any) {
    console.error("Error initializing database:", error)
    return { success: false, message: `Failed to initialize database: ${error.message}` }
  }
}

export async function autoAssignPdfs() {
  const supabase = createAdminClient()
  try {
    const { data: files, error: filesError } = await supabase.from("uploaded_files").select("original_name, url")
    if (filesError) throw filesError

    const { data: items, error: itemsError } = await supabase
      .from("product_items")
      .select("id, code")
      .is("sample_link", null)
    if (itemsError) throw itemsError

    let assignments = 0
    for (const item of items) {
      const matchingFile = files.find((file) => file.original_name.toUpperCase().startsWith(item.code.toUpperCase()))
      if (matchingFile) {
        await supabase.from("product_items").update({ sample_link: matchingFile.url }).eq("id", item.id)
        assignments++
      }
    }
    revalidatePath("/admin")
    return { success: true, message: `Auto-assigned ${assignments} PDF links.` }
  } catch (error: any) {
    return { success: false, message: `Failed to auto-assign PDFs: ${error.message}` }
  }
}

const slugify = (text: string) => {
  if (!text) return ""
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^\w-]+/g, "") // Remove all non-word chars
    .replace(/--+/g, "-") // Replace multiple - with single -
}

export async function importFromJotform(brandId: string, brandSlug: string, htmlCode: string) {
  if (!htmlCode) {
    return { success: false, message: "HTML code cannot be empty." }
  }

  try {
    const supabase = createAdminClient()
    const $ = cheerio.load(htmlCode)

    // 1. Pre-process all descriptive text blocks into a map.
    // Key: CODE, Value: { name, description, sample_link }
    const descriptionMap = new Map<string, { name: string; description: string | null; sample_link: string | null }>()
    $('li[data-type="control_text"]').each((_, element) => {
      const $el = $(element)
      const htmlContent = ($el.find(".form-html").html() || "").replace(/<br\s*\/?>/gi, "\n")
      const textContent = cheerio.load(`<div>${htmlContent}</div>`).text()
      const lines = textContent
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean)

      let code: string | null = null
      let name: string | null = null
      let description: string | null = null

      lines.forEach((line) => {
        const parts = line.split(":")
        const key = parts.shift()?.trim().toUpperCase()
        const value = parts.join(":").trim()

        if (key === "CODE") code = value
        else if (key === "ITEM" || key === "REFERRALS" || key === "PATIENT BROCHURES") name = value
        else if (key === "DESCRIPTION") description = value
      })

      const sample_link = $el.find("a").attr("href") || null

      if (code && name) {
        descriptionMap.set(code, { name, description, sample_link })
      }
    })

    const createdSections: { title: string; items: any[] }[] = []

    // Find all section containers
    $("ul.form-section").each((index, sectionEl) => {
      const $sectionEl = $(sectionEl)
      let sectionTitle = `Imported Section ${index + 1}`

      const prevHeader = $sectionEl.prev('li[data-type="control_head"]')
      const collapseEl = $sectionEl.find('li[data-type="control_collapse"]').first()
      const headerEl = $sectionEl.find('li[data-type="control_head"]').first()

      if (prevHeader.length > 0) {
        sectionTitle = prevHeader.find(".form-header").text().trim()
      } else if (collapseEl.length > 0) {
        sectionTitle = collapseEl.find(".form-collapse-mid").text().trim()
      } else if (headerEl.length > 0) {
        sectionTitle = headerEl.find(".form-header").text().trim()
      }

      const sectionItems: any[] = []

      $sectionEl.find("li.form-line").each((_, lineEl) => {
        const $lineEl = $(lineEl)
        const dataType = $lineEl.data("type")
        let item: any = null

        if (dataType === "control_checkbox" || dataType === "control_radio") {
          const code = $lineEl.find("label.form-label").text().trim()
          const details = descriptionMap.get(code)
          if (details) {
            const options: string[] = []
            $lineEl.find(".form-checkbox-item, .form-radio-item").each((_, optEl) => {
              options.push($(optEl).find("label").text().trim())
            })
            item = {
              ...details,
              code,
              field_type: "checkbox_group",
              options,
              is_required: $lineEl.hasClass("jf-required"),
            }
          }
        } else if (
          dataType === "control_textbox" ||
          dataType === "control_textarea" ||
          dataType === "control_datetime"
        ) {
          const label = $lineEl.find("label.form-label").text().trim().replace(/\*$/, "").trim()
          if (label) {
            let field_type: ProductItem["field_type"] = "text"
            if (dataType === "control_textarea") field_type = "textarea"
            if (dataType === "control_datetime") field_type = "date"

            item = {
              name: label,
              code: slugify(label),
              description: $lineEl.find(".form-sub-label").text().trim() || null,
              field_type,
              options: [],
              placeholder: $lineEl.find("input, textarea").attr("placeholder") || null,
              is_required: $lineEl.hasClass("jf-required"),
              sample_link: null,
            }
          }
        }

        if (item) {
          sectionItems.push(item)
        }
      })

      if (sectionItems.length > 0) {
        createdSections.push({ title: sectionTitle, items: sectionItems })
      }
    })

    if (createdSections.length === 0) {
      return { success: false, message: "Could not find any form fields to import. Please check the Jotform code." }
    }

    // Now, save to database
    let sortOrder = 999
    for (const section of createdSections) {
      const { data: newSection, error: sectionError } = await supabase
        .from("product_sections")
        .insert({
          title: section.title,
          brand_id: brandId,
          sort_order: sortOrder++,
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
      message: `Successfully imported ${createdSections.reduce(
        (acc, s) => acc + s.items.length,
        0,
      )} fields from Jotform.`,
    }
  } catch (error) {
    console.error("Jotform import error:", error)
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during import."
    return { success: false, message: `Import failed: ${errorMessage}` }
  }
}

export async function uploadLogoFromUrl(
  logoUrl: string,
  brandId: string | null,
): Promise<{ success: boolean; file?: any; error?: string }> {
  try {
    const response = await fetch(logoUrl)
    if (!response.ok) {
      return { success: false, error: `Failed to fetch logo from ${logoUrl}` }
    }
    const fileBuffer = await response.arrayBuffer()
    const contentType = response.headers.get("content-type") || "application/octet-stream"
    const originalName = path.basename(new URL(logoUrl).pathname) || `logo-${nanoid(5)}`

    const filename = `admin-uploads/${Date.now()}-${originalName}`
    const blob = await put(filename, fileBuffer, {
      access: "public",
      contentType: contentType,
    })

    const supabase = createAdminClient()
    const { data: uploadedFile, error } = await supabase
      .from("uploaded_files")
      .insert({
        filename: filename,
        original_name: `fetched-${originalName}`,
        url: blob.url,
        pathname: blob.pathname,
        size: blob.size,
        content_type: blob.contentType,
        brand_id: brandId,
      })
      .select()
      .single()

    if (error) throw error

    return { success: true, file: uploadedFile }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return { success: false, error: `Failed to upload logo from URL: ${message}` }
  }
}

export async function runSchemaV5Update() {
  try {
    await executeSqlFile("scripts/update-schema-v5.sql")
    return { success: true, message: "Schema updated successfully for relative URLs!" }
  } catch (error: any) {
    console.error("Error running schema v5 update:", error)
    return { success: false, message: `Failed to update schema: ${error.message}` }
  }
}

export async function forceSchemaReload() {
  try {
    await executeSqlFile("scripts/force-schema-reload.sql")
    return { success: true, message: "Schema cache reloaded successfully! Please try your previous action again." }
  } catch (error: any) {
    console.error("Error forcing schema reload:", error)
    return { success: false, message: `Failed to reload schema: ${error.message}` }
  }
}

export async function runBrandSchemaCorrection() {
  try {
    await executeSqlFile("scripts/correct-brands-schema.sql")
    return {
      success: true,
      message: "Brands table schema corrected and cache reloaded successfully! The page should now work correctly.",
    }
  } catch (error: any) {
    console.error("Error correcting brands schema:", error)
    return { success: false, message: `Failed to correct schema: ${error.message}` }
  }
}

export async function fetchBrandDataFromUrl(
  url: string,
  brandId: string | null,
): Promise<{ success: boolean; locations?: ClinicLocation[]; logoPathname?: string; error?: string }> {
  if (!process.env.XAI_API_KEY) {
    return { success: false, error: "AI service is not configured on the server." }
  }

  try {
    const response = await fetch(url)
    if (!response.ok) {
      return { success: false, error: `Failed to fetch URL. Status: ${response.status}` }
    }
    const html = await response.text()
    const $ = cheerio.load(html)
    const baseUrl = new URL(url).origin

    // --- Logo Fetching Logic ---
    let logoUrl: string | undefined
    const logoSelectors = [
      'meta[property="og:logo"]',
      'meta[property="og:image"]',
      'img[src*="logo"]',
      'img[class*="logo"]',
      "header img",
      'link[rel="apple-touch-icon"]',
      'link[rel="shortcut icon"]',
      'link[rel="icon"]',
    ]

    for (const selector of logoSelectors) {
      const potentialLogoSrc = $(selector).attr("content") || $(selector).attr("src") || $(selector).attr("href")
      if (potentialLogoSrc) {
        logoUrl = new URL(potentialLogoSrc, baseUrl).href
        break // Stop at the first logo found
      }
    }

    let logoPathname: string | undefined
    if (logoUrl) {
      const uploadResult = await uploadLogoFromUrl(logoUrl, brandId)
      if (uploadResult.success && uploadResult.file) {
        logoPathname = uploadResult.file.pathname
      }
    }

    // --- Clinic Location Fetching Logic ---
    $("script, style, nav, header, footer").remove()
    const bodyText = $("body").text()
    const cleanText = bodyText.replace(/\s\s+/g, " ").trim()

    const { object: locationsObject } = await generateObject({
      model: xai("grok-3"),
      schema: z.object({
        locations: z.array(
          z.object({
            name: z.string().describe("The full name of the clinic or location."),
            address: z.string().describe("The full street address of the location."),
            phone: z.string().describe("The primary phone number for the location."),
          }),
        ),
      }),
      prompt: `Analyze the following text from a website and extract all clinic or office locations. For each location, provide its name, full address, and phone number. If a piece of information is not available, leave it as an empty string. Website text: "${cleanText}"`,
    })

    return { success: true, locations: locationsObject.locations, logoPathname }
  } catch (error) {
    console.error("Error fetching brand data with AI:", error)
    const message = error instanceof Error ? error.message : "An unknown error occurred."
    return { success: false, error: `AI processing failed: ${message}` }
  }
}

export async function runPrimaryColorFix() {
  try {
    await executeSqlFile("scripts/fix-primary-color-issue.sql")
    return {
      success: true,
      message: "Schema fixed and cache reloaded. The 'primary_color' error should now be resolved.",
    }
  } catch (error: any) {
    console.error("Error running primary color fix:", error)
    return { success: false, message: `Failed to run fix: ${error.message}` }
  }
}
