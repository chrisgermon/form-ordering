import { createServerSupabaseClient } from "@/lib/supabase/server"
import AdminDashboard from "./AdminDashboard"
import type { Brand } from "@/lib/types"

// Data fetching functions are now here, removed from the deleted actions.ts
async function getSubmissions() {
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .from("submissions")
    .select(
      `
      *,
      brands (
        name
      )
    `,
    )
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching submissions:", error)
    return []
  }

  // The query returns 'brands' as an object, let's flatten it
  return data.map((s: any) => ({ ...s, brand_name: s.brands?.name || "Unknown Brand" }))
}

async function getBrands(): Promise<Brand[]> {
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase.from("brands").select("*").order("name")
  if (error) {
    console.error("Error fetching brands:", error)
    return []
  }
  return data
}

export default async function AdminPage() {
  // No more user check or redirect
  const [submissions, brands] = await Promise.all([getSubmissions(), getBrands()])

  return <AdminDashboard initialSubmissions={submissions} initialBrands={brands} />
}
