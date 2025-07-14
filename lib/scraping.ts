import { openai } from "@ai-sdk/openai"
import { generateObject } from "ai"
import { z } from "zod"
import { JSDOM } from "jsdom"

// Define the schema for a single form item
const formItemSchema = z.object({
  id: z.string().describe("A unique identifier for the item (e.g., 'item-1')"),
  name: z.string().describe("The human-readable label for the form item (e.g., 'Patient Name')"),
  type: z
    .enum(["text", "textarea", "select", "radio", "checkbox", "date", "number"])
    .describe("The type of the form input"),
  options: z.array(z.string()).optional().describe("For 'select' or 'radio' types, a list of available options."),
})

// Define the schema for a form section
const formSectionSchema = z.object({
  id: z.string().describe("A unique identifier for the section (e.g., 'section-1')"),
  title: z.string().describe("The title of the form section (e.g., 'Patient Details')"),
  items: z.array(formItemSchema).describe("A list of form items within this section."),
})

// Define the schema for the entire form structure
const formStructureSchema = z.object({
  sections: z.array(formSectionSchema).describe("An array of sections that make up the form."),
})

export type FormStructure = z.infer<typeof formStructureSchema>

/**
 * Cleans HTML by removing script, style, and other non-essential tags.
 * @param html The raw HTML string.
 * @returns A cleaner HTML string focusing on form elements.
 */
function cleanHtml(html: string): string {
  const dom = new JSDOM(html)
  const { document } = dom.window

  // Remove unwanted elements
  document.querySelectorAll("script, style, link, meta, head").forEach((el) => el.remove())

  return document.body.innerHTML
}

/**
 * Parses an HTML string using AI to extract a structured form definition.
 * @param htmlContent The HTML content of the form to parse.
 * @returns A promise that resolves to the structured form data.
 */
export async function parseFormWithAI(htmlContent: string): Promise<FormStructure> {
  console.log("Starting AI form parsing...")

  const cleanedHtml = cleanHtml(htmlContent)
  console.log("Cleaned HTML for AI processing (first 500 chars):", cleanedHtml.substring(0, 500))

  try {
    const { object: formStructure } = await generateObject({
      model: openai("gpt-4o-mini"), // Using a more efficient model
      schema: formStructureSchema,
      prompt: `
        You are an expert at analyzing HTML and extracting structured data.
        Analyze the following HTML content and extract the form structure based on the provided schema.
        Identify sections, labels, and input fields (text, select, radio, etc.).
        Group related fields into logical sections. Generate unique, URL-friendly IDs for all sections and items.

        HTML Content:
        ---
        ${cleanedHtml}
        ---
      `,
    })

    console.log("AI parsing successful.")
    return formStructure
  } catch (error) {
    console.error("Error during AI form parsing:", error)
    throw new Error("Failed to parse form structure with AI.")
  }
}
