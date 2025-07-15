import { createClient } from "@/utils/supabase/server"
import AdminDashboard from "./AdminDashboard"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Terminal } from "lucide-react"

export default async function AdminPage() {
  const supabase = createClient()

  try {
    const brandsData = supabase.from("brands").select("*").order("name")
    const filesData = supabase.from("files").select("*").order("uploaded_at", { ascending: false })
    const submissionsData = supabase.from("submissions").select("*").order("created_at", { ascending: false })

    const [
      { data: brands, error: brandsError },
      { data: files, error: filesError },
      { data: submissions, error: submissionsError },
    ] = await Promise.all([brandsData, filesData, submissionsData])

    if (brandsError || filesError || submissionsError) {
      const errorMessages = [brandsError?.message, filesError?.message, submissionsError?.message]
        .filter(Boolean)
        .join(", ")
      throw new Error(errorMessages || "An unknown error occurred while fetching admin data.")
    }

    return <AdminDashboard brands={brands || []} files={files || []} submissions={submissions || []} />
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred."
    console.error("Admin Page Error:", errorMessage)
    return (
      <div className="container mx-auto py-10">
        <Alert variant="destructive">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Error Loading Admin Dashboard</AlertTitle>
          <AlertDescription>
            <p>There was a problem fetching the necessary data. Please check the server logs for more details.</p>
            <p className="font-mono bg-muted p-2 rounded-md mt-2 text-xs">{errorMessage}</p>
          </AlertDescription>
        </Alert>
      </div>
    )
  }
}
