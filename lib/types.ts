export type ClinicLocation = {
  name: string
  address: string
  phone: string
  email: string
}

export type Brand = {
  id: number
  created_at: string
  name: string
  slug: string
  logo: string | null
  active: boolean
  emails: string[]
  clinic_locations: ClinicLocation[]
}

export type Section = {
  id: string
  brand_id: string
  title: string
  position: number
  items: Item[]
}

export type Item = {
  id: string
  brand_id: string
  section_id: string
  code: string | null
  name: string
  field_type: "text" | "textarea" | "select" | "checkbox" | "radio" | "date"
  options: string[] | null
  placeholder: string | null
  is_required: boolean
  position: number
}

export type FileRecord = {
  id: number
  brand_id: string
  url: string
  pathname: string
  content_type: string
  content_disposition: string
  uploaded_at: string
}

export type Submission = {
  id: number
  created_at: string
  brand_id: string
  form_data: Record<string, any>
  status: "new" | "viewed" | "archived"
}
