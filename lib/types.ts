// This file is the single source of truth for all data structures.

export interface Brand {
  id: string
  name: string
  slug: string
  logo: string | null
  active: boolean
  clinics: string[]
}

export interface Section {
  id: string
  name: string
  items: Item[]
}

export interface Item {
  id: string
  name: string
  type: "text" | "number" | "checkbox" | "textarea"
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
  status: "pending" | "sent" | "failed"
  created_at: string
  updated_at: string
}
