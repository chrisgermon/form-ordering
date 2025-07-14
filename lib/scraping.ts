import { openai } from "@ai-sdk/openai"
import { generateObject } from "ai"
import { z } from "zod"
import * as cheerio from "cheerio"

// This schema defines the structure of the AI's output.
// It's an object containing an array of sections.
const FormSectionSchema = z.object({
  title: z.string().describe("The title of this section of the form."),
  position: z.number().int().describe("The order of the section within the form, starting from 0."),
  items: z
    .array(
      z.object({
        name: z.string().describe("The human-readable label for the form field (e.g., 'Patient Name')"),
        description: z.string().optional().describe("Any additional helper text or description for the field."),
        field_type: z
          .enum(["text", "textarea", "date", "checkbox", "select", "radio"])
          .describe("The type of the form field."),
        is_required: z.boolean().describe("Whether the field is required."),
        placeholder: z.string().optional().describe("The placeholder text for the input field."),
        position: z.number().int().describe("The order of the item within the section, starting from 0."),
      }),
    )
    .describe("The list of form items within this section."),
})

export const FormStructureSchema = z.object({
  sections: z.array(FormSectionSchema),
})

export type FormStructure = z.infer<typeof FormStructureSchema>

function cleanHtml(html: string): string {
  const $ = cheerio.load(html)
  $("script, style, head, link, meta").remove()
  $("*")
    .contents()
    .filter(function () {
      return this.type === "comment"
    })
    .remove()
  const bodyHtml = $("body").html()
  return (bodyHtml || $.html()).replace(/\s\s+/g, " ").trim()
}

export async function parseFormWithAI(htmlContent: string): Promise<FormStructure> {
  console.log("Starting AI form parsing...")
  const cleanedHtml = cleanHtml(htmlContent)
  console.log("Cleaned HTML for AI processing (first 500 chars):", cleanedHtml.substring(0, 500))

  try {
    const { object: formStructure } = await generateObject({
      model: openai("gpt-4o-mini"),
      schema: FormStructureSchema,
      prompt: `Parse the following HTML code from a form. Extract all form fields, including their labels, types (text, textarea, date, checkbox, select, radio), and any placeholder text. Group them into logical sections based on the HTML structure (like fieldsets or headings). Determine if a field is required. Provide the output as a structured JSON object containing a 'sections' array.

HTML Content:
\`\`\`html
${cleanedHtml}
\`\`\`
`,
    })
    console.log("AI parsing successful.")
    return formStructure
  } catch (error) {
    console.error("Error during AI form parsing:", error)
    throw new Error("Failed to parse form structure with AI.")
  }
}
