// Props passed from Server to Client Component. Only primitive types.
export type SafeFormProps = {
  brand: {
    id: string
    name: string
    slug: string
    logo: string | null
  }
  locations: {
    value: string
    label: string
  }[]
  sections: {
    id: string
    title: string
    items: {
      id: string
      name: string
      code: string | null
      fieldType: string
    }[]
  }[]
}

// The payload for our server action, constructed from FormData
export interface ActionPayload {
  brandSlug: string
  orderedBy: string
  email: string
  billToId: string
  deliverToId: string
  notes: string
  items: Record<string, string> // All item values will be strings from FormData
}

export interface Brand {
  id: number
  name: string
  slug: string
  logo_url: string | null
  primary_color: string | null
  secondary_color: string | null
  created_at: string
}

export interface ClinicLocation {
  id: number
  name: string
  address: string | null
  brand_id: number
}

export interface ProductSection {
  id: number
  name: string
  description: string | null
  sort_order: number
  brand_id: number
}

export interface ProductItem {
  id: number
  name: string
  sort_order: number
  product_section_id: number
  brand_id: number
  field_type: string // e.g., 'text', 'number', 'checkbox', 'select'
  options?: ItemOption[]
}

export interface ItemOption {
  id: number
  name: string
  sort_order: number
  product_item_id: number
}

export interface Submission {
  id: number
  brand_id: number
  clinic_location_id: number
  ordered_by: string
  email_to: string
  form_data: any // JSONB
  created_at: string
}

export type ActionState = {
  success: boolean
  message: string
  submissionId?: string | null
}
