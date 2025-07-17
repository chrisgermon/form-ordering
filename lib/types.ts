export interface Brand {
  id: string
  name: string
  slug: string
  logo: string | null
  created_at: string
  updated_at: string
}

export interface ClinicLocation {
  id: string
  name: string
  address: string
  phone: string | null
  brand_id: string
  created_at: string
  updated_at: string
}

export interface FormSection {
  id: string
  title: string
  order_index: number
  brand_id: string
  created_at: string
  updated_at: string
  items: FormItem[]
}

export interface FormItem {
  id: string
  name: string
  code: string | null
  order_index: number
  section_id: string
  created_at: string
  updated_at: string
}

export interface OrderInfo {
  orderNumber: string
  orderedBy: string
  email: string
  deliverTo: ClinicLocation | null
  billTo: ClinicLocation | null
  notes?: string
}

export interface OrderInfoForPdf {
  orderNumber: string
  orderedBy: string
  email: string
  deliverTo: {
    name: string
    address: string
  }
  billTo: {
    name: string
    address: string
  }
  notes?: string
}

export interface OrderItem {
  id: string
  name: string
  code: string | null
  quantity: number
}

export interface FormData {
  brand: Brand
  locations: ClinicLocation[]
  sections: FormSection[]
}

// Simple types for the client component to avoid object serialization issues
export interface LocationOption {
  value: string
  label: string
}

export interface ClientFormData {
  brand: {
    name: string
    slug: string
    logo: string | null
  }
  locationOptions: LocationOption[]
  sections: FormSection[]
}
