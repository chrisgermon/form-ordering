export interface Brand {
  id: string
  name: string
  slug: string
  logo_url?: string
  primary_color?: string
  secondary_color?: string
  clinics?: Clinic[]
  created_at: string
  updated_at: string
}

export interface Clinic {
  id: string
  name: string
  address: string
  phone: string
  email: string
}

export interface Section {
  id: string
  brand_id: string
  title: string
  description?: string
  order: number
  items: Item[]
  created_at: string
  updated_at: string
}

export interface Item {
  id: string
  section_id: string
  title: string
  description?: string
  type: "text" | "textarea" | "select" | "checkbox" | "radio" | "file" | "date" | "number"
  options?: string[]
  required: boolean
  order: number
  created_at: string
  updated_at: string
}

export interface BrandWithSections extends Brand {
  sections: Section[]
}

export interface Submission {
  id: string
  brand_id: string
  form_data: Record<string, any>
  files?: string[]
  status: "pending" | "processing" | "completed" | "cancelled"
  created_at: string
  updated_at: string
  completion_date?: string
  completion_notes?: string
  brands?: {
    name: string
    slug: string
  }
}
