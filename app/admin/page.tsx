import { createClient } from "@/lib/supabase/server"
import { checkUserPermissions } from "@/lib/utils"
import AdminDashboard from "./AdminDashboard"
import type { Brand } from "@/lib/types"

export default async function AdminPage() {
  const supabase = createClient()
  await checkUserPermissions(supabase)

  const { data: brands, error: brandsError } = await supabase.from("brands").select("*").order("name")
  const { data: submissions, error: submissionsError } = await supabase
    .from("submissions")
    .select("*, brands(name, slug)")
    .order("created_at", { ascending: false })

  if (brandsError || submissionsError) {
    console.error("Error fetching admin data:", brandsError || submissionsError)
    return <div>Error loading data. Please check the logs.</div>
  }

  return <AdminDashboard brands={brands as Brand[]} submissions={submissions as any[]} />
}
