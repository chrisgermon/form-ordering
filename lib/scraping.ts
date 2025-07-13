import { generateText } from "ai"
import { xai } from "@ai-sdk/xai"
import * as cheerio from "cheerio"
import { z } from "zod"

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
export async function parseFormWithAI(htmlContent: string): Promise<ParsedForm> {
  try {
    const $ = cheerio.load(htmlContent)
    // Prioritize the <form> tag, but fall back to the whole body.
    let formHtml = $("form").html()
    if (!formHtml) {
      formHtml = $("body").html()
    }
    if (!formHtml) {
      throw new Error("Could not find a form or body content in the provided HTML.")
    }

    // Clean up the HTML to make it easier for the AI to parse.
    const cleanHtml = formHtml.replace(/\s\s+/g, " ").replace(/(\r\n|\n|\r)/gm, "")

    const prompt = `
      Analyze the following HTML of a form. Your task is to convert it into a structured JSON object.
      Identify logical sections of the form (e.g., wrapped in <fieldset> or <div> with a heading).
      For each field, determine its label, type, and any options.

      The final JSON output must be a single, raw JSON object adhering to this exact structure:
      {
        "sections": [
          {
            "title": "string",
            "items": [
              {
                "code": "string", // Generate a short, unique code like 'SEC01_ITM01'.
                "name": "string", // The user-facing label of the field.
                "fieldType": "string", // Must be one of: "checkbox_group", "select", "text", "textarea", "date".
                "options": ["string"], // For "select" and "checkbox_group" types.
                "placeholder": "string | null",
                "isRequired": boolean
              }
            ]
          }
        ]
      }

      Guidelines:
      - Map HTML inputs to 'fieldType':
        - <input type="text"> -> "text"
        - <input type="email"> -> "text"
        - <input type="tel"> -> "text"
        - <input type="date"> -> "date"
        - <textarea> -> "textarea"
        - <select> -> "select" (extract <option> values for 'options')
        - <input type="radio"> or <input type="checkbox"> -> "checkbox_group" (group by name attribute and use their labels/values for 'options')
      - 'isRequired' should be true if the element has a 'required' attribute.
      - 'placeholder' should be the value of the 'placeholder' attribute.
      - 'name' should be derived from the <label> associated with the input.
      - Do not include any explanations, notes, or markdown formatting like \`\`\`json.

      HTML to analyze:
      ${cleanHtml.substring(0, 18000)}
    `

    const { text } = await generateText({
      model: xai("grok-3"),
      prompt: prompt,
      maxTokens: 4096,
    })

    const parsedData = extractJson(text)
    const validatedData = FormScrapeSchema.parse(parsedData)
    return validatedData
  } catch (error) {
    console.error("Error parsing form with AI:", error)
    const message = error instanceof Error ? error.message : "An unknown error occurred during AI form parsing."
    throw new Error(message)
  }
}
