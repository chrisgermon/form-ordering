// Base types from DB tables
export interface ClinicLocation {
  id: string
  name: string
  address: string
  phone: string
  email: string
}

export interface Option {
  id: string
  item_id: string
  brand_id: string
  value: string
  label: string | null
  sort_order: number
}

export interface Item {
  id: string
  section_id: string
  brand_id: string
  code: string
  name: string
  description: string | null
  sample_link: string | null
  field_type: "text" | "textarea" | "number" | "date" | "checkbox" | "select" | "radio"
  placeholder: string | null
  is_required: boolean
  position: number
  options: Option[]
}

export interface Section {
  id: string
  brand_id: string
  title: string
  position: number
  items: Item[]
}

export interface Brand {
  id: string
  name: string
  slug: string
  logo: string | null
  emails: string[]
  active: boolean
}

// Composite type for the form editor and public form page
export type BrandData = Brand & {
  clinic_locations: ClinicLocation[]
  sections: (Section & {
    items: (Item & {
      options: Option[]
    })[]
  })[]
}

// Types for order submission and processing
export interface OrderInfo {
  orderNumber: string
  orderedBy: string
  email: string
  billTo: ClinicLocation
  deliverTo: ClinicLocation
  notes?: string
}

export interface OrderItem {
  code: string
  name: string
  quantity: string | number
}

export interface OrderPayload {
  brandSlug: string
  items: Record<string, OrderItem>
  orderInfo: OrderInfo
}

export interface UploadedFile {
  id: string
  file_name: string
  file_path: string
  file_type: string
  file_size: number
  uploaded_at: string
  brand_id: string | null
}
