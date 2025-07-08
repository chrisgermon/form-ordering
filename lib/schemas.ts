import { z } from "zod"

export const brandSchema = z.object({
  name: z.string().min(1, "Name is required"),
  initials: z.string().optional(),
  slug: z.string().min(1, "Slug is required"),
  to_emails: z.array(z.string().email("Invalid email format.")).optional(),
  cc_emails: z.array(z.string().email("Invalid email format.")).optional(),
  bcc_emails: z.array(z.string().email("Invalid email format.")).optional(),
  clinic_locations: z.array(z.string()).optional(),
  logo_url: z.string().nullable().optional(),
  active: z.boolean().default(true),
})

export const formSectionSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Section title cannot be empty."),
  sort_order: z.number(),
})

export const formItemSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Item name cannot be empty."),
  code: z.string().min(1, "Item code cannot be empty."),
  field_type: z.enum(["text", "textarea", "checkbox_group", "radio_group", "select", "date"]),
  options: z.array(z.string()).optional(),
  is_required: z.boolean().optional(),
  description: z.string().nullable().optional(),
  placeholder: z.string().nullable().optional(),
  sample_link: z.string().nullable().optional(),
  sort_order: z.number(),
})
