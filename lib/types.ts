export type FieldType = "text" | "textarea" | "number" | "date" | "checkbox" | "select" | "radio"

export interface Option {
  id: string
  item_id: string
  value: string
  label: string | null
  position: number
  created_at: string
}

export interface Item {
  id: string
  section_id: string
  name: string
  description: string | null
  field_type: FieldType
  is_required: boolean
  placeholder: string | null
  position: number
  created_at: string
  options: Option[]
}

export interface Section {
  id: string
  brand_id: string
  title: string
  description: string | null
  position: number
  created_at: string
  items: Item[]
}

export interface ClinicLocation {
  id: string
  brand_id: string
  name: string
  email: string | null
  created_at: string
}

export interface Brand {
  id: string
  name: string
  slug: string
  logo: string | null
  active: boolean
  created_at: string
}

// Simplified types for client-side components
export interface LocationOption {
  value: string
  label: string
}

// Props for the ClientForm component
export interface ClientFormParams {
  brandName: string
  brandSlug: string
  brandLogo: string | null
  locationOptions: LocationOption[]
  sections: Section[]
}

// Type for form submission server action
export interface OrderInfo {
  orderedBy: string
  email: string
  billToId: string
  deliverToId: string
  notes?: string
}
