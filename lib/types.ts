export type ProductSection = {
  id: string
  name: string
  created_at: string
  brand_id: string
  position: number
  items: ProductItem[]
}

export type ProductItem = {
  id: string
  name: string
  code: string
  created_at: string
  section_id: string
  position: number
}

export type BrandData = {
  id: string
  slug: string
  name: string
  initials: string
  to_emails?: string
  cc_emails?: string
  bcc_emails?: string
  subject_line?: string
  form_title?: string
  form_subtitle?: string
  logo_url?: string | null
  header_image_url?: string | null
  product_sections: ProductSection[]
}

export type Submission = {
  id: string
  created_at: string
  brand_name: string
  clinic_name: string
  contact_name: string
  contact_phone: string
  contact_email: string
  delivery_date: string
  order_details: {
    section: string
    items: {
      name: string
      code: string
      quantity: number
    }[]
  }[]
  status: "Pending" | "Completed"
  pdf_url: string | null
}

export type UploadedFile = {
  id: string
  pathname: string
  url: string
  content_type: string
  size: number
  created_at: string
  brand_id: string | null // Added brand_id
}

export type AllowedIp = {
  id: string
  ip_address: string
  description: string
  created_at: string
}
