import { createServerSupabaseClient } from "@/lib/supabase"
import AdminDashboard from "./AdminDashboard"
import { AdminActions } from "./AdminActions"
import type { Brand, Submission } from "@/lib/types"

type FormattedSubmission = Submission & { brand_name: string }

async function getData() {
  const supabase = createServerSupabaseClient()

  const { data: brands, error: brandsError } = await supabase.from("brands").select("*").order("name")
  if (brandsError) {
    console.error("Error fetching brands:", brandsError)
    throw new Error("Could not fetch brands.")
  }

  const { data: submissions, error: submissionsError } = await supabase
    .from("submissions")
    .select("*, brand_name:brands(name)")
    .order("created_at", { ascending: false })

  if (submissionsError) {
    console.error("Error fetching submissions:", submissionsError)
    throw new Error("Could not fetch submissions.")
  }

  // The type from Supabase might be { brand_name: { name: string } | null }[]
  // We need to flatten it to FormattedSubmission[]
  const formattedSubmissions = submissions.map((s: any) => ({
    ...s,
    brand_name: s.brands?.name || "Unknown Brand",
    brands: undefined, // remove the nested object
  })) as FormattedSubmission[]

  return { brands: brands as Brand[], submissions: formattedSubmissions }
}

export default async function AdminPage() {
  const { brands, submissions } = await getData()
  return (
    <>
      <AdminActions />
      <AdminDashboard initialBrands={brands} initialSubmissions={submissions} />
    </>
  )
}
