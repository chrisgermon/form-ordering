import AdminDashboard from "./AdminDashboard"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import type { Submission, Brand } from "@/lib/types"

export default async function AdminPage() {
  const supabase = createServerSupabaseClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return redirect("/login")
  }

  const { data: submissionsData, error: submissionsError } = await supabase
    .from("submissions")
    .select("*, brand:brands(name)")
    .order("created_at", { ascending: false })

  const { data: brandsData, error: brandsError } = await supabase.from("brands").select("*").order("name")

  if (submissionsError) {
    console.error("Error fetching submissions:", submissionsError.message)
    // Return the component with empty submissions to prevent a crash
    return <AdminDashboard initialSubmissions={[]} initialBrands={brandsData || []} />
  }
  if (brandsError) {
    console.error("Error fetching brands:", brandsError.message)
  }

  // Ensure we pass arrays, even if empty or on error
  const submissions: Submission[] = submissionsData || []
  const brands: Brand[] = brandsData || []

  return <AdminDashboard initialSubmissions={submissions} initialBrands={brands} />
}
