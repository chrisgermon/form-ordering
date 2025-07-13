export interface ClinicLocation {
  name: string
  address: string
  phone: string
}

export interface Item {
  id: string
  code: string
  name: string
  description: string | null
  field_type: "checkbox_group" | "select" | "text" | "textarea" | "date"
  options: string[]
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
  logo: string | null
  emails: string[]
  clinic_locations: ClinicLocation[]
  active: boolean
  sections: Section[]
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
  brand_id: string | null
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
