export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      allowed_ips: {
        Row: {
          created_at: string
          id: string
          ip_address: string
        }
        Insert: {
          created_at?: string
          id?: string
          ip_address: string
        }
        Update: {
          created_at?: string
          id?: string
          ip_address?: string
        }
        Relationships: []
      }
      brands: {
        Row: {
          active: boolean
          bcc_emails: string[] | null
          cc_emails: string[] | null
          created_at: string
          id: string
          logo_url: string | null
          name: string
          slug: string
          subject_line: string | null
          to_emails: string[] | null
        }
        Insert: {
          active?: boolean
          bcc_emails?: string[] | null
          cc_emails?: string[] | null
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          slug: string
          subject_line?: string | null
          to_emails?: string[] | null
        }
        Update: {
          active?: boolean
          bcc_emails?: string[] | null
          cc_emails?: string[] | null
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          slug?: string
          subject_line?: string | null
          to_emails?: string[] | null
        }
        Relationships: []
      }
      items: {
        Row: {
          created_at: string
          id: string
          name: string
          order: number
          section_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          order?: number
          section_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          order?: number
          section_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "items_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id"]
          },
        ]
      }
      schema_migrations: {
        Row: {
          executed_at: string
          id: number
          script_name: string
        }
        Insert: {
          executed_at?: string
          id?: number
          script_name: string
        }
        Update: {
          executed_at?: string
          id?: number
          script_name?: string
        }
        Relationships: []
      }
      sections: {
        Row: {
          brand_id: string
          created_at: string
          id: string
          name: string
          order: number
        }
        Insert: {
          brand_id: string
          created_at?: string
          id?: string
          name: string
          order?: number
        }
        Update: {
          brand_id?: string
          created_at?: string
          id?: string
          name?: string
          order?: number
        }
        Relationships: [
          {
            foreignKeyName: "sections_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      submissions: {
        Row: {
          brand_id: string
          clinic_name: string | null
          created_at: string
          dispatch_date: string | null
          dispatch_notes: string | null
          form_data: Json | null
          id: string
          order_number: number
          patient_dob: string | null
          patient_email: string | null
          patient_medicare: string | null
          patient_name: string | null
          patient_phone: string | null
          pdf_url: string | null
          referrer_email: string | null
          referrer_name: string | null
          referrer_provider_number: string | null
          status: string
          tracking_link: string | null
          urgent: boolean
        }
        Insert: {
          brand_id: string
          clinic_name?: string | null
          created_at?: string
          dispatch_date?: string | null
          dispatch_notes?: string | null
          form_data?: Json | null
          id?: string
          order_number?: number
          patient_dob?: string | null
          patient_email?: string | null
          patient_medicare?: string | null
          patient_name?: string | null
          patient_phone?: string | null
          pdf_url?: string | null
          referrer_email?: string | null
          referrer_name?: string | null
          referrer_provider_number?: string | null
          status?: string
          tracking_link?: string | null
          urgent?: boolean
        }
        Update: {
          brand_id?: string
          clinic_name?: string | null
          created_at?: string
          dispatch_date?: string | null
          dispatch_notes?: string | null
          form_data?: Json | null
          id?: string
          order_number?: number
          patient_dob?: string | null
          patient_email?: string | null
          patient_medicare?: string | null
          patient_name?: string | null
          patient_phone?: string | null
          pdf_url?: string | null
          referrer_email?: string | null
          referrer_name?: string | null
          referrer_provider_number?: string | null
          status?: string
          tracking_link?: string | null
          urgent?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "submissions_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      run_sql: {
        Args: {
          sql_query: string
        }
        Returns: undefined
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

export type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"]
export type Enums<T extends keyof Database["public"]["Enums"]> = Database["public"]["Enums"][T]

export type Brand = {
  id: string
  name: string
  slug: string
  logo_url: string | null
  form_title: string
  created_at: string
  sections: Section[]
}

export type Item = {
  id: string
  section_id: string
  label: string
  type: "text" | "date" | "checkbox" | "textarea" | "number"
  required: boolean
  placeholder: string | null
  options: string[] | null
  position: number
}

export type Section = {
  id: string
  brand_id: string
  title: string
  description: string | null
  position: number
  items: Item[]
}

export type Submission = {
  id: string
  created_at: string
  brand_id: string
  ordered_by: string
  email: string
  patient_name: string
  status: "Pending" | "Complete"
  order_number: string | null
  pdf_url: string | null
  form_data: Record<string, any>
  dispatch_date: string | null
  tracking_link: string | null
  dispatch_notes: string | null
  brands: Brand | null // This comes from the join query
}

export type SubmissionWithBrand = Submission & {
  brands: Brand
}

export type AllowedIp = {
  id: string
  created_at: string
  ip_address: string
}
