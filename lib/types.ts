export interface Brand {
  id: string
  name: string
  slug: string
  logo: string | null
  active: boolean
  created_at: string
  updated_at: string
}

export interface ClinicLocation {
  id: string
  brand_id: string
  name: string
  address: string
  phone: string | null
  email: string | null
  created_at: string
  updated_at: string
}

export interface FormItem {
  id: string
  section_id: string
  brand_id: string
  name: string
  code: string | null
  description: string | null
  field_type: string
  placeholder: string | null
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

export interface SafeFormData {
  brandName: string
  brandSlug: string
  brandLogo: string | null
  locationOptions: LocationOption[]
  sections: Array<{
    id: string
    title: string
    items: Array<{
      id: string
      name: string
      code: string | null
      fieldType: string
      placeholder: string | null
      isRequired: boolean
    }>
  }>
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

export interface OrderInfoForPdf {
  orderNumber: string
  orderedBy: string
  email: string
  deliverTo: {
    name: string
    address: string
  }
  billTo: {
    name: string
    address: string
  }
  notes?: string
}

export interface OrderItem {
  id: string
  name: string
  code: string | null
  quantity: number
}
