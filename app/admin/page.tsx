import { createServerSupabaseClient } from "@/lib/supabase"
import AdminDashboard from "./AdminDashboard"
import SubmissionsTable from "./SubmissionsTable"
import AdminActions from "./AdminActions"

export const dynamic = "force-dynamic"

export default async function AdminPage() {
  const supabase = createServerSupabaseClient()
  const { data: brands, error: brandsError } = await supabase
    .from("brands")
    .select("*")
    .order("name", { ascending: true })

  const { data: submissions, error: submissionsError } = await supabase
    .from("submissions")
    .select("*, brands(name, logo)")
    .order("created_at", { ascending: false })
    .limit(10)

  if (brandsError || submissionsError) {
    return <p>Error loading data: {brandsError?.message || submissionsError?.message}</p>
  }

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          <AdminDashboard brands={brands || []} />
          <SubmissionsTable initialSubmissions={submissions || []} />
        </div>
        <div className="lg:col-span-1">
          <AdminActions />
        </div>
      </div>
    </div>
  )
}
