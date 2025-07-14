import { createClient } from "@/lib/supabase/server"
import AdminDashboard from "./admin-dashboard"
import { unstable_noStore as noStore } from "next/cache"
import type { Submission, Brand, UploadedFile } from "@/lib/types"

async function getAdminData() {
  noStore() // Ensures the data is fetched on every request
  const supabase = createClient()

  const submissionsPromise = supabase
    .from("submissions")
    .select("*, brand:brands(name)") // Join with brands table to get the name
    .order("created_at", { ascending: false })

  const brandsPromise = supabase.from("brands").select("*").order("name")

  const filesPromise = supabase.from("uploaded_files").select("*").order("uploaded_at", { ascending: false })

  const [submissionsResult, brandsResult, filesResult] = await Promise.all([
    submissionsPromise,
    brandsPromise,
    filesPromise,
  ])

  if (submissionsResult.error) {
    console.error("Error fetching submissions:", submissionsResult.error)
    throw new Error("Could not fetch submissions.")
  }
  if (brandsResult.error) {
    console.error("Error fetching brands:", brandsResult.error)
    throw new Error("Could not fetch brands.")
  }
  if (filesResult.error) {
    console.error("Error fetching files:", filesResult.error)
    throw new Error("Could not fetch files.")
  }

  // Map the fetched data to match the `Submission` type structure
  const submissions: Submission[] = (submissionsResult.data || []).map((s: any) => ({
    ...s,
    brand_name: s.brand?.name || "Unknown Brand",
    brand: undefined, // Remove the nested brand object to match the type
  }))

  return {
    submissions,
    brands: (brandsResult.data as Brand[]) || [],
    uploadedFiles: (filesResult.data as UploadedFile[]) || [],
  }
}

export default async function AdminPage() {
  const { submissions, brands, uploadedFiles } = await getAdminData()
  return <AdminDashboard initialSubmissions={submissions} initialBrands={brands} initialUploadedFiles={uploadedFiles} />
}
