export type ClinicLocation = {
  name: string
  address: string
  phone: string
  email: string
}

export type Brand = {
  id: string
  created_at: string
  name: string
  slug: string
  logo: string | null
  active: boolean
  emails: string[]
  clinic_locations: ClinicLocation[]
  sections?: Section[]
}

export type BrandData = Brand & {
  sections: Section[]
}

export type Option = {
  id: string
  item_id: string
  value: string
  label: string | null
  sort_order: number | null
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
  description: string | null
  field_type: "text" | "textarea" | "select" | "checkbox_group" | "radio" | "date"
  options: Option[] | null
  placeholder: string | null
  is_required: boolean
  position: number
  sample_link: string | null
}

export type FileRecord = {
  id: string
  brand_id: string
  url: string
  pathname: string
  content_type: string
  size: number
  uploaded_at: string
  original_name: string
}

export type Submission = {
  id: string
  created_at: string
  brand_id: string
  ordered_by: string | null
  email: string | null
  bill_to: string | null
  deliver_to: string | null
  items: Record<string, any> | null
  pdf_url: string | null
  status: "new" | "viewed" | "archived"
  email_response: string | null
  order_data: Record<string, any> | null
  ip_address: string | null
}
