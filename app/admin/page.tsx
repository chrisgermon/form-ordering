import { createClient } from "@/lib/supabase/server"
import AdminDashboard from "./AdminDashboard"
import type { Brand, Submission } from "@/lib/types"

export default async function AdminPage() {
  const supabase = createClient()

  const { data: brands, error: brandsError } = await supabase.from("brands").select("*").order("name")
  const { data: submissions, error: submissionsError } = await supabase
    .from("submissions")
    .select("*, brands(name)")
    .order("created_at", { ascending: false })

  if (brandsError || submissionsError) {
    return (
      <div className="p-4">
        <p>Error loading data:</p>
        {brandsError && <p>Brands: {brandsError.message}</p>}
        {submissionsError && <p>Submissions: {submissionsError.message}</p>}
      </div>
    )
  }

  return <AdminDashboard brands={brands as Brand[]} submissions={submissions as Submission[]} />
}
