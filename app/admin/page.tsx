import { createAdminClient } from "@/utils/supabase/server"
import { AdminDashboard } from "./AdminDashboard"
import type { Brand, Submission, FileRecord } from "@/lib/types"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

async function getDashboardData(): Promise<{
  brands: Brand[]
  submissions: Submission[]
  files: FileRecord[]
  error?: string | null
}> {
  try {
    const supabase = createAdminClient()
    const [brandsRes, submissionsRes, filesRes] = await Promise.all([
      supabase.from("brands").select("*").order("name"),
      supabase.from("submissions").select("*").order("created_at", { ascending: false }),
      // FIX: Use 'uploaded_at' instead of 'created_at' for the files table
      supabase
        .from("files")
        .select("*")
        .order("uploaded_at", { ascending: false }),
    ])

    if (brandsRes.error || submissionsRes.error || filesRes.error) {
      console.error("Dashboard data fetch error:", {
        brandsError: brandsRes.error,
        submissionsError: submissionsRes.error,
        filesError: filesRes.error,
      })
      throw new Error(
        brandsRes.error?.message ||
          submissionsRes.error?.message ||
          filesRes.error?.message ||
          "An unknown database error occurred.",
      )
    }

    return {
      brands: brandsRes.data || [],
      submissions: submissionsRes.data || [],
      files: filesRes.data || [],
      error: null,
    }
  } catch (error: any) {
    console.error("Error in getDashboardData:", error)
    return {
      brands: [],
      submissions: [],
      files: [],
      error: `Failed to load dashboard data: ${error.message}`,
    }
  }
}

export default async function AdminPage() {
  const { brands, submissions, files, error } = await getDashboardData()

  if (error) {
    return (
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <AdminDashboard brands={brands} submissions={submissions} files={files} />
      </div>
    </div>
  )
}
