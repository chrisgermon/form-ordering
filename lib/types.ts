export interface Brand {
  id: string
  name: string
  slug: string
  logo: string | null
  emails: string[]
  active: boolean
}

export interface ClinicLocation {
  id: string
  name: string
  address: string
  brand_id: string
}

export interface LocationOption {
  value: string
  label: string
}

export interface Option {
  id: string
  item_id: string
  value: string
  label: string | null
  sort_order: number
}

export interface Item {
  id: string
  section_id: string
  name: string
  description: string | null
  placeholder: string | null
  field_type: "text" | "textarea" | "number" | "checkbox" | "select" | "radio" | "date"
  is_required: boolean
  position: number
  code: string
  options: Option[]
}

export interface Section {
  id: string
  brand_id: string
  title: string
  position: number
}

export interface SectionWithItems extends Section {
  items: Item[]
}

export interface BrandData extends Brand {
  clinic_locations: ClinicLocation[]
  sections: SectionWithItems[]
}

export interface Submission {
  id: number
  brand_id: string
  ordered_by: string
  email: string
  bill_to: string
  deliver_to: string
  notes: string | null
  items: any
  created_at: string
}
