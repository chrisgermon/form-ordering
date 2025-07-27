// This file is the single source of truth for all data structures.

export interface ProductItem {
  id: string
  code: string
  name: string
  description: string | null
  quantities: string[]
  sample_link: string | null
  sort_order: number
  section_id: string
  brand_id: string
}

export interface ProductSection {
  id: string
  title: string
  sort_order: number
  brand_id: string
  product_items: ProductItem[]
}

export interface Brand {
  id: string
  name: string
  slug: string
  logo: string | null
  primary_color: string
  email: string
  active: boolean
  clinics: string[]
  product_sections: ProductSection[]
}

export interface UploadedFile {
  id: string
  filename: string
  original_name: string
  url: string
  uploaded_at: string
  size: number
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
  pdf_url: string | null
  status: "pending" | "sent" | "failed" | "completed"
  created_at: string
  updated_at: string
  brand_name?: string // Joined from brands table
  ip_address?: string
  delivery_details?: string | null
  expected_delivery_date?: string | null
  completed_at?: string | null
  completed_by?: string | null
}
