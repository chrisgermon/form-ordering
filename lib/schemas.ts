import { z } from "zod"
import type { BrandData } from "./types"

const itemSchema = z
  .object({
    quantity: z.any(), // Can be string, date, or boolean depending on field_type
    name: z.string(),
    code: z.string(),
    customQuantity: z.string().optional(),
  })
  .optional()

// This is the schema for the form data on the client side
export const getClientSideOrderSchema = (brandData: BrandData) =>
  z
    .object({
      orderedBy: z.string().min(1, "Ordered by is required."),
      email: z.string().email("A valid email address is required."),
      billTo: z.string().min(1, "Bill to clinic is required."),
      deliverTo: z.string().min(1, "Deliver to clinic is required."),
      date: z.date({ required_error: "A date is required." }),
      items: z.record(itemSchema).optional(),
      notes: z.string().optional(),
    })
    .superRefine((data, ctx) => {
      const hasItems = Object.values(data.items || {}).some(
        (item) => item && item.quantity !== "" && item.quantity !== null && item.quantity !== undefined,
      )

      if (!hasItems) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["items"],
          message: "Please select at least one item to order.",
        })
      }

      if (brandData && brandData.product_sections) {
        ;(brandData.product_sections || []).forEach((section) => {
          ;(section.product_items || []).forEach((item) => {
            if (item.is_required) {
              const value = data.items?.[item.id]
              if (!value || value.quantity === "" || value.quantity === null || value.quantity === undefined) {
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
    })

// This is the schema for the data received by the API route
export const apiOrderSchema = z.object({
  brandId: z.string(),
  orderedBy: z.string(),
  email: z.string().email(),
  billTo: z
    .object({
      name: z.string(),
      address: z.string().optional().nullable(),
      phone: z.string().optional().nullable(),
      email: z.string().optional().nullable(),
    })
    .nullable(),
  deliverTo: z
    .object({
      name: z.string(),
      address: z.string().optional().nullable(),
      phone: z.string().optional().nullable(),
      email: z.string().optional().nullable(),
    })
    .nullable(),
  date: z.string().datetime(),
  items: z
    .record(
      z.object({
        quantity: z.any(),
        name: z.string(),
        code: z.string(),
        customQuantity: z.string().optional(),
      }),
    )
    .optional(),
  notes: z.string().optional(),
})
