export interface Clinic {
  name: string
  address: string
}

export interface Brand {
  id: string
  name: string
  slug: string
  logo: string | null
  active: boolean
  primary_color: string | null
  email: string | null
  clinics: Clinic[] | null
  created_at: string
}

export interface ProductSection {
  id: string
  title: string
  sort_order: number
  brand_id: string
  items: ProductItem[]
}

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

export interface OrderItem {
  item_id: string
  code: string
  name: string
  quantity: string
  custom_quantity?: string
}

export interface Submission {
  id: string
  brand_id: string
  clinic_name: string
  clinic_address: string
  contact_name: string
  contact_email: string
  contact_phone: string
  order_items: OrderItem[]
  status: "Pending" | "In Progress" | "Completed" | "Cancelled"
  created_at: string
  completed_by?: string | null
  completed_at?: string | null
  tracking_number?: string | null
  brands: {
    name: string
    logo: string | null
  }
}
