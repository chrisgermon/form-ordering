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

// Fallback simple scraper for when AI is not needed or fails
function simpleScrape(html: string, url: string): ScrapedData {
  const $ = cheerio.load(html)
  const baseUrl = new URL(url).origin

  const companyName = $("title").first().text() || $('meta[property="og:title"]').attr("content") || ""

  let logoUrl: string | null = null
  const logoSelectors = [
    'meta[property="og:logo"]',
    'meta[property="og:image"]',
    'link[rel="apple-touch-icon"]',
    'link[rel="shortcut icon"]',
    'link[rel="icon"]',
    'img[id*="logo"]',
    'img[class*="logo"]',
    "header img",
  ]

  for (const selector of logoSelectors) {
    const potentialLogoSrc = $(selector).attr("content") || $(selector).attr("src") || $(selector).attr("href")
    if (potentialLogoSrc) {
      try {
        logoUrl = new URL(potentialLogoSrc, baseUrl).href
        break
      } catch (e) {
        /* ignore invalid urls */
      }
    }
  }

  return {
    companyName,
    logoUrl,
    locations: [], // Simple scraper won't find locations
  }
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
    const mainContent = $("body").html()

    if (!mainContent || mainContent.length < 100) {
      console.log("Content too short, using simple scraper as fallback.")
      return simpleScrape(html, url)
    }

    const prompt = `
      Analyze the following HTML content from the website at ${url}. Your task is to extract the company name, a full URL to their primary logo, and a list of their physical clinic/business locations.

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

      If you cannot find a specific piece of information (e.g., no phone number for a location), the value should be null. If no locations are found, "locations" should be an empty array [].

      HTML Content to analyze:
      ${mainContent.substring(0, 18000)}
    `

    const { text } = await generateText({
      model: xai("grok-3"),
      prompt: prompt,
      maxTokens: 2048,
    })

    const jsonString = text.trim()
    const parsedData = JSON.parse(jsonString)
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
