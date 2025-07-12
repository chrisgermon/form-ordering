import { createAdminClient } from "@/utils/supabase/server"
import {
  createAdminTables,
  initializeDatabase,
  runSchemaV5Update,
  forceSchemaReload,
  runBrandSchemaCorrection,
  runPrimaryColorFix,
  runSubmissionsFKFix,
  saveBrand,
  fetchBrandData,
  importForm,
} from "./actions"
import { AdminDashboard } from "./AdminDashboard"
import type { Brand, FormSubmission, UploadedFile } from "@/lib/types"

export const dynamic = "force-dynamic"

async function getDashboardData() {
  const supabase = createAdminClient()
  const actions = {
    createAdminTables,
    initializeDatabase,
    runSchemaV5Update,
    forceSchemaReload,
    runBrandSchemaCorrection,
    runPrimaryColorFix,
    runSubmissionsFKFix,
  }
  const formActions = { saveBrand, fetchBrandData, importForm }

  try {
    const brandsQuery = supabase.from("brands").select("*").order("name")
    const submissionsQuery = supabase
      .from("submissions") // <-- Corrected table name
      .select("*, brands(name)")
      .order("created_at", { ascending: false }) // <-- Corrected column name
      .limit(100)
    const filesQuery = supabase.from("uploaded_files").select("*").order("uploaded_at", { ascending: false }).limit(100)

    const [{ data: brands }, { data: submissions }, { data: files }] = await Promise.all([
      brandsQuery,
      submissionsQuery,
      filesQuery,
    ])

    return {
      brands: (brands as Brand[]) || [],
      submissions: (submissions as FormSubmission[]) || [],
      files: (files as UploadedFile[]) || [],
      actions,
      formActions,
      error: null,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    console.error("Error loading dashboard data:", errorMessage)
    return {
      brands: [],
      submissions: [],
      files: [],
      actions,
      formActions,
      error: `There was a problem fetching initial data: "${errorMessage}"\nPlease go to the System tab and run the Fix Submissions Relationship action to resolve this.`,
    }
  }
}

export default async function AdminPage() {
  const { brands, submissions, files, actions, formActions, error } = await getDashboardData()

  return (
    <div className="container mx-auto p-4">
      <AdminDashboard
        initialBrands={brands}
        initialSubmissions={submissions}
        initialFiles={files}
        actions={actions}
        formActions={formActions}
        error={error}
      />
    </div>
  )
}
