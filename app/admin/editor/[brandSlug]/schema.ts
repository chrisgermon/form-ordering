import { z } from "zod"

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export const itemSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Item name is required."),
  description: z.string().optional(),
  sample_link: z.string().url("Must be a valid URL.").optional().or(z.literal("")),
  quantities: z.string().optional(), // Comma-separated string
  sort_order: z.number(),
  // The following fields might exist on the data but are not part of the form editing
  section_id: z.string().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
})

export const sectionSchema = z.object({
  id: z.string(),
  // `title` comes from the DB, but we use `name` in the form
  name: z.string().min(1, "Section name is required."),
  description: z.string().optional(),
  sort_order: z.number(),
  product_items: z.array(itemSchema),
  // The following fields might exist on the data but are not part of the form editing
  brand_id: z.string().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  title: z.string().optional(),
})

export const clinicSchema = z.object({
  id: z.string().optional(), // for new clinics
  name: z.string().min(1, "Clinic name is required."),
  email: z.string().email("Invalid email address.").optional().or(z.literal("")),
  address: z.string().optional(),
})

export const formSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Brand name is required."),
  slug: z
    .string()
    .min(1, "Slug is required.")
    .regex(slugRegex, "Slug can only contain lowercase letters, numbers, and hyphens."),
  logo: z.string().url("Must be a valid URL.").optional().or(z.literal("")),
  email: z.string().email("A valid submission email is required."),
  active: z.boolean(),
  clinics: z.array(clinicSchema).optional(),
  sections: z.array(sectionSchema),
})

export type FormEditorData = z.infer<typeof formSchema>
