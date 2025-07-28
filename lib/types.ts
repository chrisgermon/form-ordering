export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      brands: {
        Row: Brand
        Insert: Omit<Brand, "id" | "created_at" | "updated_at">
        Update: Partial<Brand>
      }
      submissions: {
        Row: Submission
        Insert: Omit<Submission, "id" | "created_at" | "updated_at">
        Update: Partial<Submission>
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export interface Brand {
  id: string
  name: string
  slug: string
  logo?: string
  email: string
  active: boolean
  clinics?: Clinic[] | string[]
  created_at: string
  updated_at?: string
  product_sections?: ProductSection[]
}

export interface Clinic {
  id?: string
  name: string
  email?: string
  address?: string
}

export interface ProductSection {
  id: string
  brand_id: string
  title: string
  description?: string
  sort_order: number
  created_at: string
  updated_at?: string
  product_items?: ProductItem[]
}

export interface ProductItem {
  id: string
  section_id: string
  name: string
  description?: string
  sort_order: number
  created_at: string
  updated_at?: string
  quantities?: string[]
  sample_link?: string
}

export interface Submission {
  id: string
  brand_id: string
  ordered_by: string
  email: string
  phone: string
  bill_to: string
  deliver_to: string
  special_instructions?: string
  items: OrderItem[] | Record<string, OrderItem>
  pdf_url: string
  status: "pending" | "in_progress" | "completed" | "cancelled"
  created_at: string
  updated_at: string
  brand?: { name: string }
}

export interface OrderItem {
  name: string
  quantity: number | string
  notes?: string
  customQuantity?: string
}

export interface OrderSubmission {
  brandId: string
  brandName: string
  brandEmail: string
  orderedBy: string
  email: string
  phone: string
  billTo: string
  deliverTo: string
  items: OrderItem[]
  specialInstructions?: string
}

export type BrandWithSections = Brand & {
  product_sections: Array<
    ProductSection & {
      product_items: ProductItem[]
    }
  >
}
