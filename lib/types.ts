export interface Brand {
  id: string
  name: string
  slug: string
  email: string
  logo?: string
  active: boolean
  clinics?: Clinic[]
  product_sections?: ProductSection[]
  created_at: string
  updated_at: string
}

export interface Clinic {
  name: string
  email?: string
  address?: string
}

export interface ProductSection {
  id: string
  brand_id: string
  name: string
  description?: string
  sort_order: number
  product_items?: ProductItem[]
  created_at: string
  updated_at: string
}

export interface ProductItem {
  id: string
  section_id: string
  name: string
  description?: string
  code?: string
  sample_link?: string
  quantities?: string[]
  sort_order: number
  created_at: string
  updated_at: string
}

export interface OrderSubmission {
  id: string
  brand_id: string
  ordered_by: string
  email: string
  phone?: string
  bill_to: string
  deliver_to: string
  special_instructions?: string
  items: Record<string, OrderItem>
  pdf_url?: string
  status: "pending" | "processing" | "completed" | "cancelled"
  created_at: string
  updated_at: string
}

export interface OrderItem {
  name: string
  quantity: string
  customQuantity?: string
  description?: string
}

export type BrandWithSections = Brand & {
  product_sections: Array<
    ProductSection & {
      product_items: ProductItem[]
    }
  >
}
