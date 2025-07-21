import { AdminDashboard } from "./AdminDashboard"
import { createClient } from "@/utils/supabase/server"
import type { Brand, Submission } from "@/lib/types"

// Define a simple type for files for now.
// You can expand this based on your actual 'files' table schema.
type FileRecord = {
  id: string
  name: string
  url: string
  created_at: string
  brand_id: string | null
}

export const dynamic = "force-dynamic"

export default async function AdminDashboardPage() {
  const supabase = createClient()

  // Fetch all necessary data concurrently for performance.
  const brandsPromise = supabase.from("brands").select("*")
  const submissionsPromise = supabase.from("submissions").select("*, brands(name)")
  const filesPromise = supabase.from("files").select("*")

  const [
    { data: brands, error: brandsError },
    { data: submissions, error: submissionsError },
    { data: files, error: filesError },
  ] = await Promise.all([brandsPromise, submissionsPromise, filesPromise])

  if (brandsError || submissionsError || filesError) {
    console.error("Admin dashboard data fetching error:", {
      brandsError,
      submissionsError,
      filesError,
    })
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold text-red-600">Error Loading Dashboard Data</h1>
        <p>There was a problem fetching data from the database. Please check the server logs and try again later.</p>
      </div>
    )
  }

  // Pass the fetched data as props to the main dashboard component.
  // Provide empty arrays as fallbacks to prevent crashes.
  return (
    <div className="container mx-auto p-4">
      <AdminDashboard
        brands={(brands as Brand[]) || []}
        submissions={(submissions as Submission[]) || []}
        files={(files as FileRecord[]) || []}
      />
    </div>
  )
}
