export type Brand = {
  id: number
  name: string
  slug: string
  logo_url: string | null
  created_at: string
  updated_at: string
}

export type Section = {
  id: number
  brand_id: number
  title: string
  order: number
  created_at: string
  updated_at: string
  product_items: Item[]
}

export type Item = {
  id: number
  section_id: number
  name: string
  code: string | null
  order: number
  created_at: string
  updated_at: string
  field_type: string
}

export type Order = {
  id: number
  brand_id: number
  submitted_at: string
  patient_name: string | null
  patient_dob: string | null
  referring_doctor: string | null
  doctor_provider_number: string | null
  doctor_contact_details: string | null
  doctor_address: string | null
  cc_recipients: string | null
  clinical_notes: string | null
  status: string | null
  pdf_url: string | null
}

export type OrderItem = {
  id: number
  order_id: number
  product_item_id: number
  quantity: number | null
  value: string | null
}

export type OrderWithBrand = Order & {
  brands: {
    name: string
  } | null
}
