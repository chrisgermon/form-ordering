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

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      brands: {
        Row: {
          created_at: string
          id: string
          logo: string | null
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          logo?: string | null
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          logo?: string | null
          name?: string
          slug?: string
        }
        Relationships: []
      }
      clinic_locations: {
        Row: {
          address: string | null
          brand_id: string | null
          created_at: string
          id: string
          name: string
        }
        Insert: {
          address?: string | null
          brand_id?: string | null
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          address?: string | null
          brand_id?: string | null
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "public_clinic_locations_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      product_items: {
        Row: {
          code: string | null
          created_at: string
          display_order: number | null
          id: string
          name: string
          section_id: string | null
        }
        Insert: {
          code?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          name: string
          section_id?: string | null
        }
        Update: {
          code?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          name?: string
          section_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "public_product_items_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "product_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      product_sections: {
        Row: {
          brand_id: string | null
          created_at: string
          display_order: number | null
          id: string
          title: string
        }
        Insert: {
          brand_id?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          title: string
        }
        Update: {
          brand_id?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "public_product_sections_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      submission_items: {
        Row: {
          created_at: string
          id: string
          product_item_id: string | null
          quantity: number | null
          submission_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          product_item_id?: string | null
          quantity?: number | null
          submission_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          product_item_id?: string | null
          quantity?: number | null
          submission_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "public_submission_items_product_item_id_fkey"
            columns: ["product_item_id"]
            isOneToOne: false
            referencedRelation: "product_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_submission_items_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      submissions: {
        Row: {
          brand_id: string | null
          created_at: string
          id: string
          location_id: string | null
          notes: string | null
          ordered_by: string | null
          ordered_by_email: string | null
          status: string | null
        }
        Insert: {
          brand_id?: string | null
          created_at?: string
          id?: string
          location_id?: string | null
          notes?: string | null
          ordered_by?: string | null
          ordered_by_email?: string | null
          status?: string | null
        }
        Update: {
          brand_id?: string | null
          created_at?: string
          id?: string
          location_id?: string | null
          notes?: string | null
          ordered_by?: string | null
          ordered_by_email?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "public_submissions_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_submissions_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "clinic_locations"
            referencedColumns: ["id"]
          },
        ]
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

export type Brand = Database["public"]["Tables"]["brands"]["Row"] & {
  emails?: string[]
}

export interface ClinicLocation {
  id: string
  name: string
  address: string | null
}

export interface ProductSection {
  id: string
  title: string
}

export interface ProductItem {
  id: string
  name: string
  code: string | null
}

export interface Submission {
  id: string
  brand_id: string
  location_id: string
  ordered_by: string
  ordered_by_email: string
  notes: string | null
  status: string
  created_at: string
}

export interface SubmissionItem {
  id: string
  submission_id: string
  product_item_id: string
  quantity: number
}

// Action state for useActionState hook
export type ActionState = {
  success: boolean
  message: string
  submissionId?: string
}

export type FormState = {
  message: string
  errors?: { [key: string]: string[] } | null
  isSuccess: boolean
}

// Data for PDF generation
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
  createdAt: Date
}

// Data for email sending
export type EmailData = {
  brandName: string
  submissionId: string
  pdfBuffer: Buffer
  to: string[]
  replyTo: string
}

// All item values will be strings from FormData
export type FormItems = {
  [key: string]: string
}
