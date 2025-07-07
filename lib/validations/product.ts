import { z } from "zod"

export const createProductSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  price: z.coerce.number().min(0, "Price must be a positive number"),
  brandSlug: z.string(),
  images: z.array(z.object({ url: z.string() })).optional(),
  isFeatured: z.boolean().default(false),
  isTrending: z.boolean().default(false),
})

export type CreateProductType = z.infer<typeof createProductSchema>
