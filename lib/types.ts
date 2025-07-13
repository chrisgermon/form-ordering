export interface ClinicLocation {
  name: string
  address: string
  phone: string
}

export interface Option {
  id: string
  value: string
  item_id: string
}

export interface Item {
  id: string
  code: string
  name: string
  description: string | null
  field_type: "checkbox_group" | "select" | "text" | "textarea" | "date"
  options: Option[]
  placeholder: string | null
  is_required: boolean
  sample_link: string | null
  position: number
  section_id: string
  brand_id: string
}

export interface Section {
  id: string
  title: string
  position: number
  brand_id: string
  items: Item[]
}

export interface BrandData {
  id: string
  name: string
  slug: string
  logo: string | null // This was logo_url
  emails: string[]
  clinic_locations: ClinicLocation[]
  active: boolean
  sections: Section[] // This was product_sections
}

export interface UploadedFile {
  id: string
  pathname: string
  url: string
  original_name: string
  uploaded_at: string
  brand_id: string
}

export interface FormSubmission {
  id: string
  created_at: string
  ordered_by: string | null
  email: string | null
  status: string | null
  pdf_url: string | null
  ip_address: string | null
  brands: { name: string } | null
}

export type OrderPayload = {
  brandId: string
  items: { [key: string]: any }
  orderInfo: {
    orderNumber: string
    orderedBy: string
    email: string
    billTo: ClinicLocation | null
    deliverTo: ClinicLocation | null
    notes: string
  }
}

export type Brand = BrandData // Alias for consistency
