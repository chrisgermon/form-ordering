import { generateText, generateObject } from "ai"
import { xai, openai } from "@ai-sdk/xai"
import { z } from "zod"
import * as cheerio from "cheerio"

// --- Schema for scraping general website info (locations, logo) ---
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

// --- Schema for scraping form structure ---
const FormItemSchema = z.object({
  code: z.string().describe("A short, unique code for the item, e.g., 'PAT01'."),
  name: z.string().describe("The user-facing label for the form field."),
  fieldType: z.enum(["checkbox_group", "select", "text", "textarea", "date"]).describe("The type of form field."),
  options: z.array(z.string()).optional().describe("An array of choices for select or checkbox_group."),
  placeholder: z.string().optional().nullable().describe("Placeholder text for the input field."),
  isRequired: z.boolean().optional().describe("Whether the field is mandatory."),
})

const FormSectionSchema = z.object({
  title: z.string().describe("The title of the form section, like 'Patient Details'."),
  items: z.array(FormItemSchema),
})

export const FormScrapeSchema = z.object({
  sections: z.array(FormSectionSchema),
})
export type ParsedForm = z.infer<typeof FormScrapeSchema>

const FormSchema = z.object({
  sections: z.array(
    z.object({
      title: z.string().describe("The title of the section, e.g., 'Patient Information'"),
      position: z.number().describe("The order of the section in the form, starting from 0."),
      items: z.array(
        z.object({
          name: z.string().describe("The name of the form field, e.g., 'patient_full_name'"),
          description: z.string().optional().describe("A brief description or instruction for the field."),
          field_type: z
            .enum(["text", "textarea", "select", "checkbox", "radio", "date", "file", "email", "phone"])
            .describe("The type of the form field."),
          is_required: z.boolean().describe("Whether the field is required."),
          placeholder: z.string().optional().describe("Placeholder text for the input field."),
          position: z.number().describe("The order of the item within the section, starting from 0."),
        }),
      ),
    }),
  ),
})

/**
 * Extracts a JSON object from a string that might contain other text.
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

/**
 * Scrapes a website for general company information using AI.
 */
export async function scrapeWebsiteWithAI(url: string): Promise<ScrapedData> {
  try {
    const response = await fetch(url, { headers: { "User-Agent": "V0-Scraper/1.0" } })
    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.statusText}`)
    }
    const html = await response.text()
    const $ = cheerio.load(html)
    $("script, style, link[rel='stylesheet'], noscript, footer, header").remove()
    const mainContent = $("body").text().replace(/\s\s+/g, " ").trim()
    if (!mainContent || mainContent.length < 100) {
      throw new Error("Website content is too short or could not be read. Please check the URL.")
    }
    const prompt = `
      Analyze the following text content from the website at ${url}. Your task is to extract the company name, a full URL to their primary logo, and a list of their physical clinic/business locations.
      For each location, provide its name, full address, and phone number.
      Please return the data as a single, raw JSON object, and nothing else.
      The JSON object must follow this exact structure:
      {
        "companyName": "string | null",
        "logoUrl": "string | null",
        "locations": [
          { "name": "string | null", "address": "string | null", "phone": "string | null" }
        ]
      }
      If you cannot find a specific piece of information, the value should be null. The logoUrl must be an absolute URL.
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

/**
 * Parses form HTML into a structured JSON object using AI.
 */
export async function parseFormWithAI(htmlContent: string): Promise<z.infer<typeof FormSchema>> {
  const { object: form } = await generateObject({
    model: openai("gpt-4o"),
    schema: FormSchema,
    prompt: `Parse the following HTML form content and extract its structure. Identify sections, fields, their types, and other relevant attributes. The 'name' should be a snake_case version of the label.

HTML Content:
---
${htmlContent}
---`,
  })
  return form
}
