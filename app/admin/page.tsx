import { createServerSupabaseClient } from "@/lib/supabase/server"
import AdminDashboard from "./AdminDashboard"
import type { BrandType, SubmissionType, UploadedFileType } from "@/lib/types"
import { redirect } from "next/navigation"

// This forces the page to be re-rendered on every request, ensuring fresh data.
export const dynamic = "force-dynamic"

// This is now a pure Server Component. It fetches data and passes it to the client.
export default async function AdminPage() {
  const supabase = createServerSupabaseClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/")
  }

  // Fetch initial data on the server
  const { data: brands, error: brandsError } = await supabase.from("brands").select("*").order("name")

  const { data: submissions, error: submissionsError } = await supabase
    .from("submissions")
    .select("*, brands(name)")
    .order("created_at", { ascending: false })

  const { data: uploadedFiles, error: filesError } = await supabase.from("uploaded_files").select("*")

  // Handle errors gracefully
  if (brandsError) {
    return <p className="text-red-500 p-8">Error loading brands: {brandsError.message}</p>
  }
  if (submissionsError) {
    return <p className="text-red-500 p-8">Error loading submissions: {submissionsError.message}</p>
  }
  if (filesError) {
    console.error("Error fetching files:", filesError)
    // We can probably continue without files, so just log it.
  }

  // Format submissions data on the server
  const formattedSubmissions =
    submissions?.map((s: any) => ({
      ...s,
      brand_name: s.brands?.name || "Unknown Brand",
    })) || []

  // Pass server-fetched data to the client component
  return (
    <AdminDashboard
      initialBrands={(brands as BrandType[]) || []}
      initialSubmissions={formattedSubmissions as (SubmissionType & { brand_name: string })[]}
      initialUploadedFiles={(uploadedFiles as UploadedFileType[]) || []}
      user={session.user}
    />
  )
}
