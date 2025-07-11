"use server"

import { createClient } from "@/utils/supabase/server"
import { promises as fs } from "fs"
import path from "path"
import { revalidatePath } from "next/cache"
import * as cheerio from "cheerio"
import { generateObject } from "ai"
import { xai } from "@ai-sdk/xai"
import { z } from "zod"
import type { ClinicLocation, Brand, SystemAction } from "@/lib/types"
import { nanoid } from "nanoid"
import { put } from "@vercel/blob"
import { fetchAndUploadLogo, scrapeWebsiteForData } from "@/lib/scraping"
import { neon } from "@neondatabase/serverless"

async function executeSqlFile(filePath: string): Promise<{ success: boolean; message: string }> {
  try {
    const supabase = createClient()
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

export async function fetchWebsiteData(url: string) {
  try {
    const data = await scrapeWebsiteForData(url)
    let logoResult = null
    if (data.logoUrl) {
      logoResult = await fetchAndUploadLogo(data.logoUrl, url)
    }
    return {
      success: true,
      data: {
        ...data,
        logo: logoResult,
      },
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    return { success: false, error: errorMessage }
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
    const supabase = createClient()
    const $ = cheerio.load(finalHtmlCode)

    // Clean up the HTML to send less data to the AI
    $("script, style, nav, header, footer, img, svg").remove()
    const formHtml = $("form").length ? $("form").html() : $("body").html()
    const cleanHtml = (formHtml || "").replace(/\s\s+/g, " ").trim()

    if (!cleanHtml) {
      return { success: false, message: "Could not find any form content in the provided source." }
    }

    const formSchema = z.object({
      sections: z.array(
        z.object({
          title: z
            .string()
            .describe("A logical title for this group of fields (e.g., 'Patient Details', 'Referral Type')."),
          items: z.array(
            z.object({
              name: z.string().describe("The user-visible label for the form field."),
              code: z
                .string()
                .describe("A unique, URL-friendly identifier for the field, derived from the name or a given code."),
              description: z
                .string()
                .nullable()
                .describe("Any descriptive text or sub-label associated with the field."),
              field_type: z
                .enum(["checkbox_group", "select", "text", "textarea", "date"])
                .describe("The most appropriate type for this form field."),
              options: z
                .array(z.string())
                .describe("For 'checkbox_group' or 'select', a list of the available choices."),
              placeholder: z.string().nullable().describe("Placeholder text for text-based inputs."),
              is_required: z.boolean().describe("Whether the field is marked as mandatory."),
              sample_link: z
                .string()
                .nullable()
                .describe("Any hyperlink found associated with the field's description."),
            }),
          ),
        }),
      ),
    })

    const { object: importedForm } = await generateObject({
      model: xai("grok-3"),
      schema: formSchema,
      prompt: `Analyze the following HTML of a form and extract its structure. Group related fields into logical sections. For each field, determine its properties. HTML: "${cleanHtml}"`,
    })

    if (!importedForm.sections || importedForm.sections.length === 0) {
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

    for (const section of importedForm.sections) {
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
      message: `Successfully imported ${importedForm.sections.reduce((acc, s) => acc + s.items.length, 0)} fields.`,
    }
  } catch (error) {
    console.error("Form import error:", error)
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

    const supabase = createClient()
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

export async function getDashboardData() {
  const supabase = createClient()
  try {
    const [{ data: brands, error: brandsError }, { data: submissions, error: submissionsError }] = await Promise.all([
      supabase.from("brands").select("*, clinic_locations(*)").order("name", { ascending: true }),
      supabase.from("form_submissions").select("*, brands(name, slug)").order("created_at", { ascending: false }),
    ])

    if (brandsError) throw brandsError
    if (submissionsError) throw submissionsError

    return { brands, submissions }
  } catch (error) {
    console.error("Error loading dashboard data", error)
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    return { error: `There was a problem fetching initial data from the database. ${errorMessage}` }
  }
}

export async function fetchBrandData(url: string, brandSlug: string) {
  try {
    const [scrapedData, logoUrl] = await Promise.all([scrapeWebsiteForData(url), fetchAndUploadLogo(url, brandSlug)])

    const locations = scrapedData.locations.map((loc) => ({ name: loc, address: loc }))

    return {
      success: true,
      data: {
        name: scrapedData.title,
        logo_url: logoUrl,
        locations: locations,
      },
    }
  } catch (error) {
    console.error("Error fetching brand data:", error)
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    return { success: false, error: `Failed to fetch data from URL: ${errorMessage}` }
  }
}

export async function saveBrand(
  brandData: Omit<Brand, "id" | "created_at" | "slug"> & {
    id?: number
    slug?: string
    locations: Omit<ClinicLocation, "id" | "brand_id">[]
  },
) {
  const supabase = createClient()

  const { id, locations, ...brandFields } = brandData

  try {
    let brandResult
    let brandId: number
    let brandSlug: string

    if (id) {
      // Update existing brand
      const { data, error } = await supabase.from("brands").update(brandFields).eq("id", id).select().single()

      if (error) throw error
      brandResult = data
      brandId = brandResult.id
      brandSlug = brandResult.slug
    } else {
      // Create new brand
      const { data, error } = await supabase.from("brands").insert(brandFields).select().single()

      if (error) throw error
      brandResult = data
      brandId = brandResult.id
      brandSlug = brandResult.slug
    }

    // Delete existing locations for this brand to resync
    const { error: deleteError } = await supabase.from("clinic_locations").delete().eq("brand_id", brandId)
    if (deleteError) throw deleteError

    // Insert new locations if any
    if (locations && locations.length > 0) {
      const locationsToInsert = locations.map((loc) => ({
        ...loc,
        brand_id: brandId,
      }))
      const { error: insertError } = await supabase.from("clinic_locations").insert(locationsToInsert)
      if (insertError) throw insertError
    }

    revalidatePath("/admin")
    revalidatePath(`/forms/${brandSlug}`)
    return { success: true, data: brandResult }
  } catch (error) {
    console.error("Error saving brand:", error)
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    return { success: false, error: `Failed to save brand: ${errorMessage}` }
  }
}

export async function runSystemAction(action: SystemAction) {
  if (!process.env.POSTGRES_URL) {
    return { success: false, error: "Database URL not configured." }
  }

  try {
    const sql = neon(process.env.POSTGRES_URL)
    const query = action.query
    await sql.unsafe(query)

    revalidatePath("/admin")
    return { success: true, message: `${action.name} executed successfully.` }
  } catch (error) {
    console.error(`Error executing system action "${action.name}":`, error)
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    return { success: false, error: `Failed to execute action: ${errorMessage}` }
  }
}
