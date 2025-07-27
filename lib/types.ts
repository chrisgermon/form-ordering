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
          recipient_email: string
          clinics: Json | null
        }
        Insert: {
          id?: number
          created_at?: string
          name: string
          slug: string
          logo_url?: string | null
          recipient_email: string
          clinics?: Json | null
        }
        Update: {
          id?: number
          created_at?: string
          name?: string
          slug?: string
          logo_url?: string | null
          recipient_email?: string
          clinics?: Json | null
        }
      }
      items: {
        Row: {
          id: number
          created_at: string
          section_id: number
          code: string
          name: string
          description: string | null
          quantities: string[] | null
          sort_order: number
          sample_link: string | null
        }
        Insert: {
          id?: number
          created_at?: string
          section_id: number
          code: string
          name: string
          description?: string | null
          quantities?: string[] | null
          sort_order?: number
          sample_link?: string | null
        }
        Update: {
          id?: number
          created_at?: string
          section_id?: number
          code?: string
          name?: string
          description?: string | null
          quantities?: string[] | null
          sort_order?: number
          sample_link?: string | null
        }
      }
      sections: {
        Row: {
          id: number
          created_at: string
          brand_id: number
          title: string
          sort_order: number
        }
        Insert: {
          id?: number
          created_at?: string
          brand_id: number
          title: string
          sort_order?: number
        }
        Update: {
          id?: number
          created_at?: string
          brand_id?: number
          title?: string
          sort_order?: number
        }
      }
      submissions: {
        Row: {
          id: number
          created_at: string
          brand_id: number
          clinic_name: string
          contact_person: string
          contact_email: string
          order_details: Json
          is_completed: boolean
          completed_at: string | null
          completed_by: string | null
        }
        Insert: {
          id?: number
          created_at?: string
          brand_id: number
          clinic_name: string
          contact_person: string
          contact_email: string
          order_details: Json
          is_completed?: boolean
          completed_at?: string | null
          completed_by?: string | null
        }
        Update: {
          id?: number
          created_at?: string
          brand_id?: number
          clinic_name?: string
          contact_person?: string
          contact_email?: string
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

export type Brand = Database["public"]["Tables"]["brands"]["Row"] & {
  sections: Section[]
}
export type Section = Database["public"]["Tables"]["sections"]["Row"] & {
  items: Item[]
}
export type Item = Database["public"]["Tables"]["items"]["Row"]
export type Submission = Database["public"]["Tables"]["submissions"]["Row"] & {
  brands: { name: string }
}
export type Clinic = {
  name: string
  address: string
}
