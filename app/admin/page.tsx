import AdminDashboard from "./AdminDashboard"
import { createAdminSupabaseClient } from "@/lib/supabase/server"

export default async function AdminPage() {
  // Authentication has been temporarily removed to allow for development.
  const adminSupabase = createAdminSupabaseClient()

  const submissionsPromise = adminSupabase
    .from("submissions")
    .select("*, brand:brands(name)")
    .order("created_at", { ascending: false })

  const brandsPromise = adminSupabase.from("brands").select("*").order("name")

  const [submissionsResult, brandsResult] = await Promise.all([submissionsPromise, brandsPromise])

  const { data: submissionsData, error: submissionsError } = submissionsResult
  const { data: brandsData, error: brandsError } = brandsResult

  if (submissionsError) {
    console.error("Error fetching submissions:", submissionsError.message)
  }
  if (brandsError) {
    console.error("Error fetching brands:", brandsError.message)
  }

  return <AdminDashboard initialSubmissions={submissionsData || []} initialBrands={brandsData || []} />
}
