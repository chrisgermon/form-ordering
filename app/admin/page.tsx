import { createAdminClient } from "@/utils/supabase/server"
import { AdminDashboard } from "./AdminDashboard"
import type { Brand, FormSubmission, UploadedFile } from "@/lib/types"

export const dynamic = "force-dynamic"

async function getDashboardData() {
  const supabase = createAdminClient()

  try {
    const brandsQuery = supabase.from("brands").select("*").order("name")
    const submissionsQuery = supabase
      .from("submissions")
      .select("*, brands(name)")
      .order("created_at", { ascending: false })
      .limit(100)
    const filesQuery = supabase.from("uploaded_files").select("*").order("uploaded_at", { ascending: false }).limit(100)

    const [
      { data: brands, error: brandsError },
      { data: submissions, error: submissionsError },
      { data: files, error: filesError },
    ] = await Promise.all([brandsQuery, submissionsQuery, filesQuery])

    if (brandsError) throw brandsError
    if (submissionsError) throw submissionsError
    if (filesError) throw filesError

    return {
      brands: (brands as Brand[]) || [],
      submissions: (submissions as FormSubmission[]) || [],
      files: (files as UploadedFile[]) || [],
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
    <div className="container mx-auto p-4">
      <AdminDashboard initialBrands={brands} initialSubmissions={submissions} initialFiles={files} error={error} />
    </div>
  )
}
