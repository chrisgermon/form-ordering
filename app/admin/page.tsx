import { createClient } from "@/lib/supabase/server"
import AdminDashboard from "./AdminDashboard"
import { checkUserPermissions } from "@/lib/auth"
import type { BrandWithSubmissions, SubmissionWithBrand } from "@/lib/types"

export default async function AdminPage() {
  await checkUserPermissions()
  const supabase = createClient()

  const { data: brands, error: brandsError } = await supabase.from("brands").select("*").order("name")
  const { data: submissions, error: submissionsError } = await supabase
    .from("submissions")
    .select("*, brands(name, logo_url)")
    .order("created_at", { ascending: false })

  if (brandsError) {
    console.error("Error fetching brands:", brandsError)
  }
  if (submissionsError) {
    console.error("Error fetching submissions:", submissionsError)
  }

  const typedBrands: BrandWithSubmissions[] = (brands || []).map((b) => ({ ...b, submissions: [] }))
  const typedSubmissions: SubmissionWithBrand[] = submissions as any

  return <AdminDashboard initialBrands={typedBrands} initialSubmissions={typedSubmissions} />
}
