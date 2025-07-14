export type ClinicLocation = {
  name: string
  address: string
  phone: string
  email: string
}

export interface Option {
  id: string
  item_id: string
  brand_id: string
  value: string
  label: string | null
  sort_order: number
}

export interface Item {
  id: string
  section_id: string
  brand_id: string
  code: string // Changed from `string | null` to `string` for type safety
  name: string
  description: string | null
  sample_link: string | null
  field_type: "text" | "textarea" | "number" | "date" | "checkbox" | "select" | "radio"
  placeholder: string | null
  is_required: boolean
  position: number
  options: Option[]
}

export interface Section {
  id: string
  brand_id: string
  title: string
  position: number
  items: Item[]
}

export interface Brand {
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
  file_name: string
  file_path: string
  file_type: string
  file_size: number
  uploaded_at: string
  brand_id: string | null
}
