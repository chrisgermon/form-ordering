import { createAdminSupabaseClient } from "@/lib/supabase"
import AdminDashboard from "./AdminDashboard"
import type { Brand } from "@/lib/types"

async function getAdminData() {
  const supabase = createAdminSupabaseClient()
  const { data: brands, error: brandsError } = await supabase.from("brands").select("*").order("name")
  const { data: submissions, error: submissionsError } = await supabase
    .from("submissions")
    .select("*, brands(name)")
    .order("created_at", { ascending: false })

  if (brandsError) {
    console.error("Error fetching brands:", brandsError)
    throw new Error("Could not fetch brands.")
  }
  if (submissionsError) {
    console.error("Error fetching submissions:", submissionsError)
    throw new Error("Could not fetch submissions.")
  }

  return { brands: brands as Brand[], submissions: submissions as any[] }
}

export default async function AdminPage() {
  const { brands, submissions } = await getAdminData()
  return <AdminDashboard initialBrands={brands} initialSubmissions={submissions} />
}

export const revalidate = 0
