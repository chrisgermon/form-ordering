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
      fieldType: "text" | "number"
    }[]
  }[]
}

export type BrandData = {
  id: string
  name: string
  slug: string
  logo: string | null
}

export type FormItem = {
  id: string
  name: string
  code: string | null
  fieldType: "text" | "number" | "date"
}

export type FormSection = {
  id: string
  title: string
  items: FormItem[]
}

export type SafeItem = {
  id: string
  name: string
  code: string | null
  fieldType?: "text" | "number" | "checkbox"
}

export type SafeSection = {
  id: string
  title: string
  items: SafeItem[]
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
  id: string
  name: string
  slug: string
  logo: string | null
  emails?: string[]
  active?: boolean
}

export interface ClinicLocation {
  id: string
  name: string
  address: string | null
  phone?: string | null
  email?: string | null
  brand_id: string
}

export interface ProductSection {
  id: string
  name: string
  description: string | null
  sort_order: number
  brand_id: string
}

export interface ProductItem {
  id: string
  name: string
  sort_order: number
  product_section_id: string
  brand_id: string
  field_type: string // e.g., 'text', 'number', 'checkbox', 'select'
  options?: ItemOption[]
}

export interface ItemOption {
  id: string
  name: string
  sort_order: number
  product_item_id: string
}

export interface Submission {
  id: string
  brand_id: string | null
  location_id: string | null
  ordered_by: string | null
  ordered_by_email: string | null
  notes: string | null
  items: any // JSONB
  status: string | null
  created_at: string
}

export type ActionState = {
  success: boolean
  message: string
  submissionId?: string
}

export type FormState = {
  message: string
  errors?: {
    [key: string]: string[]
  } | null
  isSuccess: boolean
}

export type PdfData = {
  brandName: string
  brandLogo: string | null
  locationName: string
  locationAddress: string | null
  orderedBy: string
  orderedByEmail: string
  notes: string | null
  items: {
    id: string
    name: string
    code: string | null
    quantity: number
  }[]
  submissionId: string
}

export type EmailData = {
  brandName: string
  submissionId: string
  pdfBuffer: Buffer
}
