export interface ClinicLocation {
  name: string
  address: string
  phone: string
}

export interface Brand {
  id: string
  name: string
  slug: string
  logo: string
  active: boolean
  emails: string[]
  clinic_locations: ClinicLocation[]
  primary_color: string | null
  secondary_color: string | null
  created_at: string
}

export interface UploadedFile {
  id: string
  filename: string
  original_name: string
  url: string
  pathname: string
  uploaded_at: string
  size: number
  content_type: string | null
  brand_id: string | null
}

export interface FormSubmission {
  id: string
  brand_id: string
  form_data: any
  submitted_at: string
  brands: { name: string } | null // from the join
}

export interface SystemActions {
  createAdminTables: () => Promise<{ success: boolean; message: string }>
  initializeDatabase: () => Promise<{ success: boolean; message: string }>
  createExecuteSqlFunction: () => Promise<{ success: boolean; message: string }>
  runSchemaV5Update: () => Promise<{ success: boolean; message: string }>
  forceSchemaReload: () => Promise<{ success: boolean; message: string }>
  runBrandSchemaCorrection: () => Promise<{ success: boolean; message: string }>
  runPrimaryColorFix: () => Promise<{ success: boolean; message: string }>
  runSubmissionsFKFix: () => Promise<{ success: boolean; message: string }>
}
