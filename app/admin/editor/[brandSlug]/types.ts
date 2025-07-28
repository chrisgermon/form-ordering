export interface ClinicLocation {
  name: string
  address: string
  phone: string
}

export interface ProductItem {
  id: string
  code: string
  name: string
  description: string | null
  field_type: "checkbox_group" | "select" | "text" | "textarea" | "date"
  options: string[]
  placeholder: string | null
  is_required: boolean
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
  emails: string[]
  clinic_locations: ClinicLocation[]
  active: boolean
  product_sections: ProductSection[]
}

export interface UploadedFile {
  id: string
  filename: string
  original_name: string
  url: string
  pathname: string
  uploaded_at: string
  size: number
  content_type: string | null
}
