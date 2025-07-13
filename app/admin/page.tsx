import { AdminDashboard } from "./AdminDashboard"
import { getBrands, getSubmissions, getFiles } from "./data-access"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import type { Brand, FileRecord, Submission } from "@/lib/types"
import { createClient } from "@/utils/supabase/server"

export const revalidate = 0

async function getDashboardData() {
  const supabase = createClient()
  let brands: Brand[] = []
  let files: FileRecord[] = []
  let submissions: Submission[] = []
  let error: string | null = null

  try {
    const { data: brandsData, error: brandsError } = await supabase
      .from("brands")
      .select("id, name, slug, logo, active, emails, clinic_locations")
      .order("name", { ascending: true })

    if (brandsError) throw brandsError
    brands = brandsData || []

    const { data: filesData, error: filesError } = await supabase
      .from("files")
      .select("*")
      .order("uploaded_at", { ascending: false })

    if (filesError) throw filesError
    files = filesData || []

    const { data: submissionsData, error: submissionsError } = await supabase
      .from("submissions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100)

    if (submissionsError) throw submissionsError
    submissions = submissionsData || []
  } catch (e: any) {
    console.error("Failed to load dashboard data:", e)
    error = `Failed to load dashboard data: ${e.message}`
  }

  return { brands, files, submissions, error }
}

export default async function AdminPage() {
  const [brands, submissions, files] = await Promise.all([getBrands(), getSubmissions(), getFiles()])

  if (brands.error || submissions.error || files.error) {
    return (
      <div className="container mx-auto p-4 md:p-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{brands.error || submissions.error || files.error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return <AdminDashboard brands={brands} submissions={submissions} files={files} />
}
