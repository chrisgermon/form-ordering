// This file is the single source of truth for all data structures.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Brand = {
  id: string
  name: string
  slug: string
  logo: string | null
  primary_color: string | null
  email: string
  active: boolean
  created_at: string
  updated_at: string
  clinics: Json | null
}

export type ProductSection = {
  id: string
  title: string
  brand_id: string
  sort_order: number
  created_at: string
  updated_at: string
}

export type ProductItem = {
  id: string
  code: string
  name: string
  description: string | null
  quantities: Json | null
  sample_link: string | null
  section_id: string
  brand_id: string
  sort_order: number
  created_at: string
  updated_at: string
}

export type Submission = {
  id: string
  brand_id: string | null
  ordered_by: string
  email: string
  bill_to: string
  deliver_to: string
  order_date: string | null
  items: Json
  pdf_url: string | null
  ip_address: string | null
  status: string | null
  created_at: string
  updated_at: string
  completed_by?: string | null
  completed_at?: string | null
}

export type UploadedFile = {
  id: string
  filename: string
  original_name: string
  url: string
  size: number
  content_type: string | null
  uploaded_at: string
}

export type Database = {
  public: {
    Tables: {
      brands: {
        Row: Brand
        Insert: Omit<Brand, "id" | "created_at" | "updated_at"> & {
          id?: string
        }
        Update: Partial<Omit<Brand, "id" | "created_at" | "updated_at">>
      }
      product_items: {
        Row: ProductItem
        Insert: Omit<ProductItem, "id" | "created_at" | "updated_at"> & {
          id?: string
        }
        Update: Partial<Omit<ProductItem, "id" | "created_at" | "updated_at">>
      }
      product_sections: {
        Row: ProductSection
        Insert: Omit<ProductSection, "id" | "created_at" | "updated_at"> & {
          id?: string
        }
        Update: Partial<Omit<ProductSection, "id" | "created_at" | "updated_at">>
      }
      submissions: {
        Row: Submission
        Insert: Omit<Submission, "id" | "created_at" | "updated_at"> & {
          id?: string
        }
        Update: Partial<Omit<Submission, "id" | "created_at" | "updated_at">>
      }
      uploaded_files: {
        Row: UploadedFile
        Insert: Omit<UploadedFile, "id" | "uploaded_at"> & { id?: string }
        Update: Partial<Omit<UploadedFile, "id" | "uploaded_at">>
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      update_updated_at_column: {
        Args: Record<PropertyKey, never>
        Returns: unknown
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
