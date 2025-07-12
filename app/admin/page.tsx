import { createAdminClient } from "@/utils/supabase/server"
import { AdminDashboard } from "./AdminDashboard"
import type { Brand, FormSubmission, UploadedFile } from "@/lib/types"
import { Toaster } from "@/components/ui/sonner"

export const dynamic = "force-dynamic"

async function getDashboardData() {
  const supabase = createAdminClient()

  try {
    const brandsQuery = supabase
      .from("brands")
      .select("id, name, slug, logo, active, emails, clinic_locations, created_at")
      .order("name")
    const submissionsQuery = supabase
      .from("submissions")
      .select("*, brands(name)")
      .order("created_at", { ascending: false })
      .limit(100)
    const filesQuery = supabase.from("uploaded_files").select("*").order("uploaded_at", { ascending: false })

    const [brandsResult, submissionsResult, filesResult] = await Promise.all([
      brandsQuery,
      submissionsQuery,
      filesQuery,
    ])

    if (brandsResult.error) throw brandsResult.error
    if (submissionsResult.error) throw submissionsResult.error
    if (filesResult.error) throw filesResult.error

    return {
      brands: (brandsResult.data as Brand[]) || [],
      submissions: (submissionsResult.data as FormSubmission[]) || [],
      files: (filesResult.data as UploadedFile[]) || [],
      error: null,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    console.error("Error loading dashboard data:", errorMessage)
    return {
      brands: [],
      submissions: [],
      files: [],
      error: `There was a problem fetching dashboard data. This is likely due to a database schema issue. Please run the schema correction script provided in the chat to resolve this. Error: "${errorMessage}"`,
    }
  }
}

export default async function AdminPage() {
  const { brands, submissions, files, error } = await getDashboardData()

  return (
    <>
      <AdminDashboard initialBrands={brands} initialSubmissions={submissions} initialFiles={files} error={error} />
      <Toaster richColors />
    </>
  )
}
