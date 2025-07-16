import { createClient } from "@/utils/supabase/server"
import { AdminDashboard } from "./AdminDashboard"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import type { Brand, Submission, FileRecord } from "@/lib/types"

async function getBrands(): Promise<{ data?: Brand[]; error?: string }> {
  const supabase = createClient()
  const { data, error } = await supabase.from("brands").select("*").order("name")
  if (error) return { error: error.message }
  return { data }
}

async function getSubmissions(): Promise<{ data?: Submission[]; error?: string }> {
  const supabase = createClient()
  const { data, error } = await supabase.from("submissions").select("*").order("created_at", { ascending: false })
  if (error) return { error: error.message }
  return { data }
}

async function getFiles(): Promise<{ data?: FileRecord[]; error?: string }> {
  const supabase = createClient()
  const { data, error } = await supabase.from("files").select("*").order("uploaded_at", { ascending: false })
  if (error) return { error: error.message }
  return { data }
}

export default async function AdminPage() {
  const [brandsResult, submissionsResult, filesResult] = await Promise.all([getBrands(), getSubmissions(), getFiles()])

  if (brandsResult.error || submissionsResult.error || filesResult.error) {
    return (
      <div className="container mx-auto p-4 md:p-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Dashboard</AlertTitle>
          <AlertDescription>{brandsResult.error || submissionsResult.error || filesResult.error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <AdminDashboard
      brands={brandsResult.data || []}
      submissions={submissionsResult.data || []}
      files={filesResult.data || []}
    />
  )
}
