import { createClient } from "@/lib/supabase/server"
import AdminDashboard from "./admin-dashboard"
import { unstable_noStore as noStore } from "next/cache"
import type { Submission, Brand } from "@/lib/types"

async function getAdminData(): Promise<{ submissions: Submission[]; brands: Brand[] }> {
  noStore()
  const supabase = createClient()
  const { data: submissions, error: submissionsError } = await supabase
    .from("submissions")
    .select("*, brand:brands(*)")
    .order("created_at", { ascending: false })

  const { data: brands, error: brandsError } = await supabase.from("brands").select("*")

  if (submissionsError) {
    console.error("Error fetching submissions:", submissionsError)
    throw new Error("Could not fetch submissions.")
  }
  if (brandsError) {
    console.error("Error fetching brands:", brandsError)
    throw new Error("Could not fetch brands.")
  }

  // Ensure submissions are properly typed. Supabase can return a single object or an array.
  const typedSubmissions = Array.isArray(submissions) ? submissions : submissions ? [submissions] : []

  return { submissions: typedSubmissions as Submission[], brands: brands || [] }
}

export default async function AdminPage() {
  const { submissions, brands } = await getAdminData()
  return <AdminDashboard initialSubmissions={submissions} initialBrands={brands} />
}
