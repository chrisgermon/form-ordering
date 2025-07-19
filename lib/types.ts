// This represents the structure of a single option for a form item (e.g., a choice in a dropdown).
export interface Option {
  id: string
  item_id: string
  label: string
  value: string
  sort_order: number
  created_at: string
}

// This represents a single form item, like a text input or a select dropdown.
export interface Item {
  id: string
  section_id: string
  name: string
  code: string | null
  field_type: "text" | "number" | "select" | "checkbox" | "radio" | "textarea"
  position: number
  required: boolean
  placeholder: string | null
  description: string | null
  created_at: string
  options: Option[] // An item can have multiple options.
}

// This represents a section of the form, which is a logical grouping of items.
export interface Section {
  id: string
  brand_id: string
  name: string
  description: string | null
  position: number
  created_at: string
  items: Item[] // A section contains multiple items.
}

// This represents a clinic location, which can be used for billing or delivery.
export interface ClinicLocation {
  id: string
  brand_id: string
  name: string
  address: string | null
  phone: string | null
  email: string | null
  created_at: string
}

// This represents the core data for a brand, including its form structure.
export interface Brand {
  id: string
  name: string
  slug: string
  logo: string | null
  emails: string[] | null
  clinic_locations: ClinicLocation[] | null
  active: boolean
  created_at: string
  sections: Section[] // A brand has multiple sections.
}

// This is a more specific type for the data passed to the brand-facing form component.
export type BrandData = Brand

// This represents a file uploaded to the system.
export interface File {
  id: string
  name: string
  url: string
  size: number
  mime_type: string
  created_at: string
  brand_id: string | null
}

// This represents a single submission of an order form.
export interface Submission {
  id: string
  brand_id: string
  ordered_by: string
  email: string
  bill_to: string | null
  deliver_to: string | null
  items: Record<string, any> // The actual items ordered.
  pdf_url: string
  status: "sent" | "failed" | "pending"
  email_response: string | null
  order_data: Record<string, any> // The full, raw order payload.
  ip_address: string | null
  created_at: string
  brands?: { name: string; slug: string } // Optional relation for display.
}

// This defines the structure of the payload for submitting an order.
export interface OrderPayload {
  brandId: string
  items: Record<string, { name: string; code: string; quantity: string | number; customQuantity?: string }>
  orderInfo: {
    orderNumber: string
    orderedBy: string
    email: string
    billTo: ClinicLocation | null
    deliverTo: ClinicLocation | null
    notes: string
  }
}
