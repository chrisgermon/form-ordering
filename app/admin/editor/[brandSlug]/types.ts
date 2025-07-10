export interface ProductItem {
  id: string
  code: string
  name: string
  description: string | null
  quantities: string[]
  sample_link: string | null
  sort_order: number
  section_id: string
  brand_id: string
}

export interface ProductSection {
  id: string
  title: string
  sort_order: number
  brand_id: string
  product_items: ProductItem[]
}

export interface Brand {
  id: string
  name: string
  slug: string
  logo: string | null
  primary_color: string
  email: string
  active: boolean
  product_sections: ProductSection[]
}

export interface UploadedFile {
  id: string
  filename: string
  original_name: string
  url: string
  uploaded_at: string
  size: number
}
