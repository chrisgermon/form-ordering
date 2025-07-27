import { createClient } from "@/lib/supabase/server"
import AdminDashboard from "./AdminDashboard"
import type { Brand, Submission } from "@/lib/types"

export default async function AdminPage() {
  const supabase = createClient()

  const { data: brands, error: brandsError } = await supabase.from("brands").select("*").order("name")
  const { data: submissions, error: submissionsError } = await supabase
    .from("submissions")
    .select("*")
    .order("created_at", { ascending: false })

  if (brandsError) {
    console.error("Error fetching brands:", brandsError)
  }
  if (submissionsError) {
    console.error("Error fetching submissions:", submissionsError)
  }

  return <AdminDashboard brands={(brands as Brand[]) || []} submissions={(submissions as Submission[]) || []} />
}
