import { createAdminClient } from "@/utils/supabase/server"
import { AdminDashboard } from "./AdminDashboard"
import {
  createAdminTables,
  initializeDatabase,
  autoAssignPdfs,
  runSchemaV5Update,
  forceSchemaReload,
  runBrandSchemaCorrection,
  runPrimaryColorFix,
  runSubmissionsFKFix,
} from "./actions"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Terminal } from "lucide-react"

export const revalidate = 0

export default async function AdminPage() {
  const supabase = createAdminClient()

  const brandsPromise = supabase.from("brands").select("*").order("name")
  const filesPromise = supabase.from("uploaded_files").select("*").order("uploaded_at", { ascending: false })
  const submissionsPromise = supabase
    .from("form_submissions")
    .select("*, brands(name)")
    .order("submitted_at", { ascending: false })
    .limit(100)

  const [
    { data: brands, error: brandsError },
    { data: uploadedFiles, error: filesError },
    { data: submissions, error: submissionsError },
  ] = await Promise.all([brandsPromise, filesPromise, submissionsPromise])

  const error = brandsError || filesError || submissionsError
  if (error) {
    // If there's an error, we still render the dashboard but show an error message.
    // The System Actions tab will still be available to fix the issue.
    console.error("Admin Dashboard Error:", error.message)
  }

  const systemActions = {
    createAdminTables,
    initializeDatabase,
    autoAssignPdfs,
    runSchemaV5Update,
    forceSchemaReload,
    runBrandSchemaCorrection,
    runPrimaryColorFix,
    runSubmissionsFKFix,
  }

  return (
    <>
      {error && (
        <div className="container mx-auto p-4 md:p-8">
          <Alert variant="destructive">
            <Terminal className="h-4 w-4" />
            <AlertTitle>Error loading dashboard data</AlertTitle>
            <AlertDescription>
              <p>There was a problem fetching initial data: "{error.message}"</p>
              <p className="mt-2">
                Please go to the <strong>System</strong> tab and run the <strong>Fix Submissions Relationship</strong>{" "}
                action to resolve this.
              </p>
            </AlertDescription>
          </Alert>
        </div>
      )}
      <AdminDashboard
        initialBrands={brands || []}
        initialFiles={uploadedFiles || []}
        initialSubmissions={submissions || []}
        systemActions={systemActions}
      />
    </>
  )
}
