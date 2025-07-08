import { z } from "zod"
import type { BrandData } from "./types"

// Schema for creating/updating a brand in the admin dashboard
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

// Schema for the form editor
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

// Schema for marking a submission as complete
export const markCompleteSchema = z.object({
  submissionId: z.string().uuid("Invalid submission ID."),
  dispatch_date: z.string().optional().nullable(),
  tracking_link: z.string().url("Invalid URL for tracking link.").optional().nullable(),
  dispatch_notes: z.string().optional().nullable(),
})

// This is the schema for the form data on the client side
export const getClientSideOrderSchema = (brandData: BrandData) =>
  z
    .object({
      orderedBy: z.string().min(1, "Ordered by is required."),
      email: z.string().email("A valid email address is required."),
      billTo: z.string().min(1, "Bill to clinic is required."),
      deliverTo: z.string().min(1, "Deliver to clinic is required."),
      date: z.date({ required_error: "A date is required." }),
      items: z.record(z.any()).optional(),
      notes: z.string().optional(),
    })
    .superRefine((data, ctx) => {
      let hasItems = false
      if (brandData && brandData.product_sections) {
        brandData.product_sections.forEach((section) => {
          section.product_items.forEach((item) => {
            const value = data.items?.[item.id]
            if (value && value.quantity !== "") {
              hasItems = true
            }

            if (item.is_required) {
              if (!value || value.quantity === "") {
                ctx.addIssue({
                  code: z.ZodIssueCode.custom,
                  path: [`items.${item.id}`],
                  message: `${item.name} is required.`,
                })
              }
            }
          })
        })
      }

      if (!hasItems) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["items"],
          message: "Please select at least one item to order.",
        })
      }
    })

// This is the schema for the data received by the API route
export const apiOrderSchema = z.object({
  brandId: z.string(),
  orderedBy: z.string(),
  email: z.string().email(),
  billTo: z.object({
    name: z.string(),
    address: z.string().optional().nullable(),
    phone: z.string().optional().nullable(),
    email: z.string().optional().nullable(),
  }),
  deliverTo: z.object({
    name: z.string(),
    address: z.string().optional().nullable(),
    phone: z.string().optional().nullable(),
    email: z.string().optional().nullable(),
  }),
  date: z.string().datetime(),
  items: z
    .record(
      z.object({
        quantity: z.string(),
        name: z.string(),
        code: z.string(),
        customQuantity: z.string().optional(),
      }),
    )
    .optional(),
  notes: z.string().optional(),
})
