import { generateObject } from "ai"
import { openai } from "@ai-sdk/openai"
import { z } from "zod"

const FormItemSchema = z.object({
  name: z.string().describe("The label or question for the form field."),
  description: z.string().optional().describe("Any additional helper text or description for the field."),
  field_type: z.enum(["text", "textarea", "date", "checkbox", "select"]).describe("The type of the form field."),
  is_required: z.boolean().describe("Whether the field is required."),
  placeholder: z.string().optional().describe("The placeholder text for the input field."),
  position: z.number().int().describe("The order of the item within the section, starting from 0."),
})

const FormSectionSchema = z.object({
  title: z.string().describe("The title of this section of the form."),
  position: z.number().int().describe("The order of the section within the form, starting from 0."),
  items: z.array(FormItemSchema).describe("The list of form items within this section."),
})

export async function parseFormWithAI(htmlContent: string) {
  const { object: parsedForm } = await generateObject({
    model: openai("gpt-4o"),
    schema: z.array(FormSectionSchema),
    prompt: `Parse the following HTML code from a form. Extract all form fields, including their labels, types (text, textarea, date, checkbox, select), and any placeholder text. Group them into logical sections based on the HTML structure (like fieldsets or headings). Determine if a field is required. Provide the output as a structured JSON array of sections.

HTML Content:
\`\`\`html
${htmlContent}
\`\`\`
`,
  })
  return parsedForm
}
