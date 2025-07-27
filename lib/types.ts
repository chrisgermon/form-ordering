// This file is the single source of truth for all data structures.

export interface Clinic {
  name: string
  address: string
}

export interface Brand {
  id: string
  name: string
  slug: string
  logo: string | null
  primary_color: string | null
  email: string | null
  active: boolean
  clinics: Clinic[]
}

export interface UploadedFile {
  id: string
  original_name: string
  url: string
}

export interface Section {
  id: string
  brand_id: string
  name: string
  position: number
  items: Item[]
}

export interface Item {
  id: string
  section_id: string
  name: string
  type: "text" | "number" | "checkbox" | "textarea"
  position: number
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
  status: "pending" | "sent" | "completed" | "failed"
  created_at: string
  updated_at: string
  delivery_details?: string
  expected_delivery_date?: string
}
