import { createClient } from "@/utils/supabase/server"
import AdminDashboard from "./AdminDashboard"
import { redirect } from "next/navigation"

export default async function AdminPage() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return redirect("/login")
  }

  const { data: brands, error: brandsError } = await supabase.from("brands").select("*")

  const { data: submissions, error: submissionsError } = await supabase
    .from("submissions")
    .select("*, brand:brands(*)")
    .order("created_at", { ascending: false })

  if (brandsError || submissionsError) {
    console.error(brandsError || submissionsError)
    // Handle error appropriately
    return <div>Error loading data.</div>
  }

  return <AdminDashboard user={user} brands={brands || []} submissions={submissions || []} />
}
