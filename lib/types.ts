import type { SVGProps } from "react"

export type IconSvgProps = SVGProps<SVGSVGElement> & {
  size?: number
}

export interface Brand {
  id: number
  name: string
  slug: string
  logo_path: string
  created_at: string
  updated_at: string
  sections: Section[]
}

export interface Section {
  id: number
  brand_id: number
  name: string
  position: number
  items: Item[]
}

export interface Item {
  id: number
  section_id: number
  name: string
  position: number
  field_type: FieldType
  options: Option[]
}

export type FieldType = "text" | "textarea" | "checkbox" | "radio" | "select" | "date"

export interface Option {
  id: number
  item_id: number
  value: string
  position: number
}

export interface File {
  id: number
  name: string
  path: string
  brand_id: number
  created_at: string
}

export interface ClinicLocation {
  id: number
  brand_id: number
  name: string
  address: string
}

export interface Submission {
  id: number
  brand_id: number
  created_at: string
  updated_at: string
  patient_name: string
  patient_dob: string
  referring_doctor: string
  clinical_notes: string
  status: string
  brand: Brand
  submission_items: SubmissionItem[]
}

export interface SubmissionItem {
  id: number
  submission_id: number
  item_id: number
  item_value: string
  item: Item
}

export type FormState = {
  message: string
  submissionId?: number
  errors?: {
    patientName?: string[]
    patientDob?: string[]
    referringDoctor?: string[]
    [key: string]: string[] | undefined
  }
} | null
