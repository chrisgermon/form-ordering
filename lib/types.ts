export interface Brand {
  id: string
  name: string
  slug: string
  email: string
  logo?: string
  clinics?: string[]
  created_at: string
  updated_at: string
  product_sections?: ProductSection[]
}

export interface ProductSection {
  id: string
  brand_id: string
  name: string
  description?: string
  order_index: number
  created_at: string
  updated_at: string
  items?: ProductItem[]
}

export interface ProductItem {
  id: string
  section_id: string
  name: string
  description?: string
  code?: string
  sample_link?: string
  order_index: number
  created_at: string
  updated_at: string
}

export interface OrderSubmission {
  id?: string
  brand_id: string
  brand_name: string
  ordered_by: string
  email: string
  bill_to: string
  deliver_to: string
  clinic_name?: string
  submitted_by?: string
  order_date?: string
  items: Record<string, any> | Array<any>
  pdf_url?: string
  ip_address?: string
  status: "pending" | "sent" | "failed" | "completed"
  created_at: string
  updated_at?: string
}

export interface Submission {
  id: string
  brand_id: string
  ordered_by: string
  email: string
  bill_to: string
  deliver_to: string
  order_date: string | null
  items: Record<string, any>
  pdf_url: string
  ip_address: string
  status: "pending" | "sent" | "failed" | "completed"
  created_at: string
  brands: {
    name: string
    email: string
  }
}
