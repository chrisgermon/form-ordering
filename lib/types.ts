export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      brands: {
        Row: {
          id: number
          created_at: string
          name: string
          slug: string
          logo_url: string | null
          primary_color: string | null
          secondary_color: string | null
          recipient_email: string
          is_active: boolean
          clinics: Json | null
        }
        Insert: {
          id?: number
          created_at?: string
          name: string
          slug: string
          logo_url?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          recipient_email: string
          is_active?: boolean
          clinics?: Json | null
        }
        Update: {
          id?: number
          created_at?: string
          name?: string
          slug?: string
          logo_url?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          recipient_email?: string
          is_active?: boolean
          clinics?: Json | null
        }
      }
      items: {
        Row: {
          id: string
          created_at: string
          section_id: string
          name: string
          order: number
          is_stationery: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          section_id: string
          name: string
          order?: number
          is_stationery?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          section_id?: string
          name?: string
          order?: number
          is_stationery?: boolean
        }
      }
      sections: {
        Row: {
          id: string
          created_at: string
          brand_id: number
          name: string
          order: number
        }
        Insert: {
          id?: string
          created_at?: string
          brand_id: number
          name: string
          order?: number
        }
        Update: {
          id?: string
          created_at?: string
          brand_id?: number
          name?: string
          order?: number
        }
      }
      submissions: {
        Row: {
          id: number
          created_at: string
          brand_id: number
          clinic: string
          practitioner_name: string
          email: string
          order_details: Json
          is_completed: boolean
          completed_at: string | null
          completed_by: string | null
        }
        Insert: {
          id?: number
          created_at?: string
          brand_id: number
          clinic: string
          practitioner_name: string
          email: string
          order_details: Json
          is_completed?: boolean
          completed_at?: string | null
          completed_by?: string | null
        }
        Update: {
          id?: number
          created_at?: string
          brand_id?: number
          clinic?: string
          practitioner_name?: string
          email?: string
          order_details?: Json
          is_completed?: boolean
          completed_at?: string | null
          completed_by?: string | null
        }
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

export type Clinic = {
  name: string
  address: string
}

export type Brand = Omit<Database["public"]["Tables"]["brands"]["Row"], "clinics"> & {
  clinics: Clinic[] | null
}

export type Item = Database["public"]["Tables"]["items"]["Row"]

export type Section = Database["public"]["Tables"]["sections"]["Row"] & {
  items: Item[]
}

export type BrandWithSectionsAndItems = Brand & {
  sections: Section[]
}

export type Submission = Database["public"]["Tables"]["submissions"]["Row"] & {
  brands: { name: string }
}
