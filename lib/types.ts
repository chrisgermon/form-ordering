export interface Brand {
  id: string
  name: string
  slug: string
  logo?: string
  active: boolean
  created_at: string
  updated_at: string
}

export interface ClinicLocation {
  id: string
  brand_id: string
  name: string
  address: string
  created_at: string
  updated_at: string
}

export interface FormItem {
  id: string
  section_id: string
  brand_id: string
  name: string
  code?: string
  description?: string
  field_type: "text" | "number" | "textarea" | "select" | "checkbox" | "radio" | "date"
  placeholder?: string
  is_required: boolean
  order_index: number
  created_at: string
  updated_at: string
  options?: FormOption[]
}

export interface FormOption {
  id: string
  item_id: string
  brand_id: string
  value: string
  label?: string
  sort_order: number
  created_at: string
  updated_at: string
}

export interface FormSection {
  id: string
  brand_id: string
  title: string
  order_index: number
  created_at: string
  updated_at: string
  items: FormItem[]
}

export interface LocationOption {
  value: string
  label: string
}

export interface SimpleBrand {
  name: string
  slug: string
  logo?: string
}

export interface ClientFormData {
  brand: SimpleBrand
  locationOptions: LocationOption[]
  sections: FormSection[]
}

export interface OrderSubmission {
  id: string
  brand_id: string
  ordered_by: string
  email: string
  deliver_to_id: string
  bill_to_id: string
  notes?: string
  status: "pending" | "processing" | "completed" | "cancelled"
  created_at: string
  updated_at: string
}

export interface OrderItem {
  id: string
  submission_id: string
  item_id: string
  quantity: number
  created_at: string
  updated_at: string
}

export interface ClientFormParams {
  brandSlug: string
  brandName: string
  brandLogo?: string
  locationOptions: LocationOption[]
  sections: Array<{
    id: string
    title: string
    position: number
    brand_id: string
    items: Array<{
      id: string
      section_id: string
      brand_id: string
      code?: string
      name: string
      description?: string
      sample_link?: string
      field_type: string
      placeholder?: string
      is_required: boolean
      position: number
      options: Array<{
        id: string
        item_id: string
        brand_id: string
        value: string
        label?: string
        sort_order: number
      }>
    }>
  }>
}
