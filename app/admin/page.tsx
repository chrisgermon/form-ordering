import { checkUserPermissions } from "@/lib/auth"
import AdminDashboard from "./AdminDashboard"
import { createClient } from "@/lib/supabase/server"
import type { Submission } from "@/lib/types"

export default async function AdminPage() {
  await checkUserPermissions()
  const supabase = createClient()

  const { data: brands, error: brandsError } = await supabase.from("brands").select("*")
  const { data: submissionsData, error: submissionsError } = await supabase
    .from("submissions")
    .select("*, brands(name)")
    .order("created_at", { ascending: false })

  if (brandsError || submissionsError) {
    console.error("Error fetching admin data:", brandsError || submissionsError)
    return <div>Error loading data. Please try again later.</div>
  }

  const submissions = submissionsData as Submission[]

  return <AdminDashboard brands={brands || []} submissions={submissions || []} />
}
