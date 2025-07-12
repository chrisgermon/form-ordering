import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
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
      model: openai("gpt-4o"), // Changed from xai("grok-3")
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

const FormFieldSchema = z.object({
  code: z.string().optional().nullable(),
  name: z.string(),
  field_type: z.enum(["checkbox_group", "select", "text", "textarea", "date"]),
  options: z.array(z.string()).optional().nullable(),
  placeholder: z.string().optional().nullable(),
  is_required: z.boolean().optional().nullable(),
})

const ParsedFormSchema = z.object({
  fields: z.array(FormFieldSchema),
})

export type ParsedForm = z.infer<typeof ParsedFormSchema>

/**
 * Uses AI to parse HTML form content into a structured JSON object.
 * @param htmlContent The HTML string of the form to parse.
 * @returns A structured object representing the form fields.
 */
export async function parseFormWithAI(htmlContent: string): Promise<ParsedForm> {
  const prompt = `
      You are an expert web form parser. Analyze the following HTML source code of a form. Your task is to identify all form fields (inputs, textareas, selects, checkboxes, radio buttons) and convert them into a structured JSON object.

      Return a single, raw JSON object and nothing else. The JSON object must follow this exact structure:
      { "fields": [ { "code": "string | null", "name": "string", "field_type": "string", "options": "string[] | null", "placeholder": "string | null", "is_required": "boolean | null" } ] }

      - "name": The label associated with the form field. This is the most important part.
      - "code": A short, unique identifier. You can generate this from the "name" or "id" attribute of the HTML element (e.g., 'PAT01'). If not available, leave it as null.
      - "field_type": Must be one of: 'text', 'textarea', 'select', 'checkbox_group', 'date'.
        - Use 'text' for <input type="text">, <input type="email">, <input type="tel">, etc.
        - Use 'date' for <input type="date">.
        - Use 'select' for <select> elements.
        - Use 'checkbox_group' for a group of <input type="checkbox"> or <input type="radio"> that share the same "name" attribute.
      - "options": An array of strings for the "value" or text of options in a 'select' or 'checkbox_group'. For other types, this should be null.
      - "placeholder": The placeholder text, if any.
      - "is_required": Set to true if the field has a "required" attribute or seems mandatory.

      HTML to analyze:
      ${htmlContent.substring(0, 18000)}
    `

  try {
    const { text } = await generateText({
      model: openai("gpt-4o"),
      prompt: prompt,
      maxTokens: 4096,
    })

    const parsedData = extractJson(text)
    const validatedData = ParsedFormSchema.parse(parsedData)
    return validatedData
  } catch (error) {
    console.error("Error parsing form with AI:", error)
    const message = error instanceof Error ? error.message : "An unknown error occurred during AI form parsing."
    throw new Error(message)
  }
}
