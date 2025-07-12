import { createAdminClient } from "@/utils/supabase/server"
import {
  createAdminTables,
  initializeDatabase,
  createExecuteSqlFunction,
  runSchemaV5Update,
  forceSchemaReload,
  runBrandSchemaCorrection,
  runPrimaryColorFix,
  runSubmissionsFKFix,
} from "./actions"
import { AdminDashboard } from "./AdminDashboard"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Terminal } from "lucide-react"

export default async function AdminPage() {
  const supabase = createAdminClient()

  const { data: brands, error: brandsError } = await supabase.from("brands").select("*").order("name")
  const { data: submissions, error: submissionsError } = await supabase
    .from("submissions")
    .select("*, brands(name)")
    .order("created_at", { ascending: false })
    .limit(100)

  const error = brandsError || submissionsError

  const systemActions = {
    createAdminTables,
    initializeDatabase,
    createExecuteSqlFunction,
    runSchemaV5Update,
    forceSchemaReload,
    runBrandSchemaCorrection,
    runPrimaryColorFix,
    runSubmissionsFKFix,
  }

  if (error) {
    return (
      <div className="p-4 md:p-8">
        <Alert variant="destructive">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Error loading dashboard data</AlertTitle>
          <AlertDescription>
            <p>There was a problem fetching initial data: "{error.message}"</p>
            <p className="mt-2 font-semibold">
              Please go to the System tab and run the recommended actions to resolve this.
            </p>
          </AlertDescription>
        </Alert>
        <div className="mt-4">
          <AdminDashboard initialBrands={[]} initialSubmissions={[]} systemActions={systemActions} />
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8">
      <AdminDashboard
        initialBrands={brands || []}
        initialSubmissions={submissions || []}
        systemActions={systemActions}
      />
    </div>
  )
}
