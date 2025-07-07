import type { z } from "zod"
import type { orderFormSchema } from "./schemas"

// This is based on the database schema and should be the source of truth
export type Brand = {
  id: string
  name: string
  slug: string
  logo_url: string | null
  created_at: string
  active: boolean
  order_sequence: number
  order_prefix: string | null
  initials: string | null
  header_image_url: string | null
  form_title: string | null
  form_subtitle: string | null
  to_emails: string[] | null
  cc_emails: string[] | null
  bcc_emails: string[] | null
  subject_line: string | null
  clinic_locations: ClinicLocation[] | null
}

export type ProductItem = {
  id: string
  section_id: string
  name: string
  description: string | null
  price: number
  sort_order: number
  active: boolean
  item_type: "checkbox" | "quantity" | "text"
  item_options: string[] | null
}

export type ProductSection = {
  id: string
  brand_id: string
  title: string
  description: string | null
  sort_order: number
  product_items: ProductItem[]
}

export type BrandData = Brand & {
  product_sections: ProductSection[]
}

export type OrderItem = {
  id: string
  name: string
  quantity?: number
  value?: string
}

export type OrderSection = {
  title: string
  items: OrderItem[]
}

export type Order = {
  brandName: string
  sections: OrderSection[]
}

export type Submission = {
  id: string
  created_at: string
  ordered_by: string
  email: string
  status: string | null
  pdf_url: string | null
  ip_address: string | null
  order_data: z.infer<typeof orderFormSchema> | null
  brands: { name: string } | null
  order_number?: string
  dispatch_date?: string | null
  tracking_link?: string | null
  dispatch_notes?: string | null
}

export type UploadedFile = {
  id: string
  pathname: string
  original_name: string
  url: string
  uploaded_at: string
  size: number
  content_type: string | null
  brand_id?: string | null
}

export interface ClinicLocation {
  name: string
  address: string
  phone: string
  email: string
}

export interface OrderInfo {
  orderNumber: string
  orderedBy: string
  email: string
  billTo?: ClinicLocation
  deliverTo?: ClinicLocation
  notes?: string
  date?: Date | string
}

export interface OrderPayload {
  brandId: string
  orderInfo: OrderInfo
  items: Record<string, any>
}

export type BrandType = Brand

export type AllowedIp = {
  id: string
  ip_address: string
  description: string | null
  created_at: string
}
