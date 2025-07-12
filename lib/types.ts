export interface ClinicLocation {
  name: string
  address: string
  phone: string
}

export interface Brand {
  id: string
  name: string
  slug: string
  logo: string | null
  active: boolean
  emails: string[]
  clinic_locations: ClinicLocation[]
  created_at: string
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
