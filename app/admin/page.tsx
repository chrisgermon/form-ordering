import { createClient } from "@/lib/supabase/server"
import AdminDashboard from "./AdminDashboard"
import { checkUserPermissions } from "@/lib/auth"

export const revalidate = 0

export default async function AdminPage() {
  await checkUserPermissions()

  const supabase = createClient()
  const { data: brands, error: brandsError } = await supabase.from("brands").select("*").order("name")
  const { data: submissions, error: submissionsError } = await supabase
    .from("submissions")
    .select("*, brands(name)")
    .order("created_at", { ascending: false })
    .limit(10)

  if (brandsError) {
    console.error("Error fetching brands:", brandsError)
  }
  if (submissionsError) {
    console.error("Error fetching submissions:", submissionsError)
  }

  return <AdminDashboard brands={brands || []} submissions={submissions || []} />
}
