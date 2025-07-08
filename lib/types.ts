export interface ClinicLocation {
  name: string
  address: string
  phone: string
  email: string
}

export interface ProductItem {
  id: string
  section_id: string
  brand_id: string
  code: string
  name: string
  description: string | null
  field_type: "checkbox_group" | "select" | "text" | "textarea" | "date"
  options: string[] | null
  placeholder: string | null
  is_required: boolean
  sample_link: string | null
  sort_order: number
}

export interface ProductSection {
  id: string
  brand_id: string
  title: string
  sort_order: number
  product_items: ProductItem[]
}

// For lists and basic info
export interface Brand {
  id: string
  name: string
  slug: string
  logo: string | null
  emails: string[]
  clinic_locations: ClinicLocation[]
  active: boolean
  order_sequence: number
}

// For the public form and the editor, includes all nested data
export interface BrandData extends Brand {
  product_sections: ProductSection[]
}

export interface OrderInfo {
  orderNumber: number
  orderedBy: string
  email: string
  billTo?: ClinicLocation
  deliverTo?: ClinicLocation
  notes?: string
}

export interface OrderPayload {
  brandId: string
  orderInfo: OrderInfo
  items: Record<string, any>
}

export type BrandType = Brand

export interface UploadedFile {
  id: string
  pathname: string
  original_name: string
  url: string
  uploaded_at: string
  size: number
  content_type: string | null
}

export interface Submission {
  id: string
  created_at: string
  ordered_by: string
  email: string
  status: string | null
  pdf_url: string | null
  ip_address: string | null
  order_data: OrderPayload | null
  brands: { name: string } | null
  order_number?: number
}
