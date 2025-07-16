export type ClinicLocation = {
  name: string
  address: string
  phone: string
  email: string
}

export type Option = {
  id: string
  brand_id: string
  item_id: string
  value: string
  label: string | null
  sort_order: number
}

export type Item = {
  id: string
  brand_id: string
  section_id: string
  code: string | null
  name: string
  description: string | null
  field_type: "text" | "textarea" | "select" | "checkbox" | "radio" | "date"
  options: Option[] // Corrected from string[] to Option[]
  placeholder: string | null
  is_required: boolean
  position: number
  sample_link: string | null
}

export type Section = {
  id: string
  brand_id: string
  title: string
  position: number
  items: Item[]
}

export type BrandData = {
  id: string
  created_at: string
  name: string
  slug: string
  logo: string | null
  active: boolean
  emails: string[]
  clinic_locations: ClinicLocation[]
  sections: Section[]
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
