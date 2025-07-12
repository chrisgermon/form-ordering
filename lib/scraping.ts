import { generateText } from "ai"
import { xai } from "@ai-sdk/xai"
import * as cheerio from "cheerio"
import { z } from "zod"

// Define the expected JSON structure from the AI using Zod for validation
const ScrapedDataSchema = z.object({
  companyName: z.string().optional().nullable(),
  logoUrl: z.string().url().optional().nullable(),
  locations: z
    .array(
      z.object({
        name: z.string().optional().nullable(),
        address: z.string().optional().nullable(),
        phone: z.string().optional().nullable(),
      }),
    )
    .optional()
    .nullable(),
})

export type ScrapedData = z.infer<typeof ScrapedDataSchema>

/**
 * Extracts a JSON object from a string that might contain other text.
 * @param text The string to extract JSON from.
 * @returns The parsed JSON object.
 */
function extractJson(text: string): any {
  const match = text.match(/\{[\s\S]*\}/)
  if (match) {
    try {
      return JSON.parse(match[0])
    } catch (e) {
      console.error("Failed to parse extracted JSON:", e)
      throw new Error("AI returned invalid JSON.")
    }
  }
  throw new Error("No JSON object found in AI response.")
}

export async function scrapeWebsiteWithAI(url: string): Promise<ScrapedData> {
  try {
    const response = await fetch(url, { headers: { "User-Agent": "V0-Scraper/1.0" } })
    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.statusText}`)
    }
    const html = await response.text()
    const $ = cheerio.load(html)

    // Clean up the HTML to send to the AI - remove scripts, styles, etc.
    $("script, style, link[rel='stylesheet'], noscript, footer, header").remove()
    const mainContent = $("body").text().replace(/\s\s+/g, " ").trim()

    if (!mainContent || mainContent.length < 100) {
      throw new Error("Website content is too short or could not be read. Please check the URL.")
    }

    const prompt = `
      Analyze the following text content from the website at ${url}. Your task is to extract the company name, a full URL to their primary logo, and a list of their physical clinic/business locations.

      For each location, provide its name, full address, and phone number. The location name should be the name of the branch or clinic (e.g., "Downtown Clinic").

      Please return the data as a single, raw JSON object, and nothing else. Do not include any explanations, notes, or markdown formatting like \`\`\`json.

      The JSON object must follow this exact structure:
      {
        "companyName": "string | null",
        "logoUrl": "string | null",
        "locations": [
          { "name": "string | null", "address": "string | null", "phone": "string | null" }
        ]
      }

      If you cannot find a specific piece of information (e.g., no phone number for a location), the value should be null. If no locations are found, "locations" should be an empty array []. The logoUrl must be an absolute URL.

      Website Text Content to analyze:
      ${mainContent.substring(0, 18000)}
    `

    const { text } = await generateText({
      model: xai("grok-3"),
      prompt: prompt,
      maxTokens: 2048,
    })

    const parsedData = extractJson(text)
    const validatedData = ScrapedDataSchema.parse(parsedData)

    // Post-process logo URL to be absolute
    if (validatedData.logoUrl && !validatedData.logoUrl.startsWith("http")) {
      validatedData.logoUrl = new URL(validatedData.logoUrl, url).href
    }

    return validatedData
  } catch (error) {
    console.error("Error scraping website with AI:", error)
    const message = error instanceof Error ? error.message : "An unknown error occurred during AI scraping."
    throw new Error(message)
  }
}
