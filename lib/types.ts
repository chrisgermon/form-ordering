export type Brand = {
  id: string
  name: string
  slug: string
  logo_url: string | null
  created_at: string
  active: boolean
  order_sequence: number | null
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
  status: "pending" | "complete" | "cancelled"
  pdf_url: string | null
  ip_address: string
  order_data: Order
  order_number: string
  brands: { name: string }
  dispatch_date: string | null
  tracking_link: string | null
  dispatch_notes: string | null
}

export type UploadedFile = {
  id: string
  file_name: string
  file_type: string
  file_size: number
  file_url: string
  uploaded_at: string
  brand_id: string | null
}

export type AllowedIp = {
  id: string
  ip_address: string
  description: string | null
  created_at: string
}
