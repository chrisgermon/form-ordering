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
} from "./actions"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Terminal } from "lucide-react"

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
    return (
      <div className="container mx-auto p-8">
        <Alert variant="destructive">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Error loading dashboard data</AlertTitle>
          <AlertDescription>
            <p>There was a problem fetching initial data from the database.</p>
            <pre className="mt-2 whitespace-pre-wrap rounded-md bg-secondary p-4 text-secondary-foreground font-mono text-xs">
              {error.message}
            </pre>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const systemActions = {
    createAdminTables,
    initializeDatabase,
    autoAssignPdfs,
    runSchemaV5Update,
    forceSchemaReload,
    runBrandSchemaCorrection,
    runPrimaryColorFix,
  }

  return (
    <AdminDashboard
      initialBrands={brands || []}
      initialFiles={uploadedFiles || []}
      initialSubmissions={submissions || []}
      systemActions={systemActions}
    />
  )
}
