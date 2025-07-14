"use server"

import { seedDatabase } from "@/lib/seed-database"
import { createServerSupabaseClient } from "@/lib/supabase"
import { revalidatePath } from "next/cache"
import { generateObject } from "ai"
import { openai } from "@ai-sdk/openai"
import { z } from "zod"
import * as cheerio from "cheerio"

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

export async function scrapeClinicsFromWebsite(
  url: string,
): Promise<{ clinics?: { name: string; address: string }[]; error?: string }> {
  if (!url || !url.startsWith("http")) {
    return { error: "A valid URL (starting with http or https) is required." }
  }

  try {
    // 1. Fetch HTML content from the URL
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to fetch website. Status: ${response.status}`)
    }
    const html = await response.text()

    // 2. Extract text content using Cheerio
    const $ = cheerio.load(html)
    const textContent = $("body").text()

    // Clean up the text content to remove excessive whitespace
    const cleanedText = textContent.replace(/\s\s+/g, " ").trim()

    // 3. Use AI to extract clinic information
    const { object } = await generateObject({
      model: openai("gpt-4o"),
      schema: z.object({
        clinics: z.array(
          z.object({
            name: z
              .string()
              .describe(
                "The short, simple name of the clinic location (e.g., for 'Focus Radiology Dapto', the name should be 'Dapto').",
              ),
            address: z.string().describe("The full street address of the clinic."),
          }),
        ),
      }),
      prompt: `You are an expert web scraper and data extractor. Your task is to analyze the text content of a webpage and extract clinic locations.

      Here is the text content from the website:
      ---
      ${cleanedText.substring(0, 15000)}
      ---

      Please extract all clinic locations from the text. For each clinic, provide its short name and its full address.

      - The name should be a short, simple identifier for the location (e.g., for "Focus Radiology Dapto", the name should be "Dapto").
      - The address should be the complete street address for that location.
      - Do not include the main brand name in the clinic name.
      - Only return entries that you are confident are distinct clinic locations with a name and an address.
      - If you cannot find any clinics, return an empty array.`,
    })

    return { clinics: object.clinics }
  } catch (error) {
    console.error("Scraping error:", error)
    return { error: error instanceof Error ? error.message : "An unknown error occurred during scraping." }
  }
}
