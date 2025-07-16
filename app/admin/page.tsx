import { createClient } from "@/utils/supabase/server"
import AdminDashboard from "./AdminDashboard"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import type { Brand, FileRecord, Submission } from "@/lib/types"

async function getBrands(): Promise<{ data: Brand[] | null; error: string | null }> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase.from("brands").select("*").order("name")
    if (error) throw error
    return { data, error: null }
  } catch (e: any) {
    return { data: null, error: e.message }
  }
}

async function getSubmissions(): Promise<{ data: Submission[] | null; error: string | null }> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase.from("submissions").select("*").order("created_at", { ascending: false })
    if (error) throw error
    return { data, error: null }
  } catch (e: any) {
    return { data: null, error: e.message }
  }
}

async function getFiles(): Promise<{ data: FileRecord[] | null; error: string | null }> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase.from("files").select("*").order("uploaded_at", { ascending: false })
    if (error) throw error
    return { data, error: null }
  } catch (e: any) {
    return { data: null, error: e.message }
  }
}

export default async function AdminPage() {
  const [brands, submissions, files] = await Promise.all([getBrands(), getSubmissions(), getFiles()])

  if (brands.error || submissions.error || files.error) {
    const errorMessage = brands.error || submissions.error || files.error
    return (
      <div className="container mx-auto p-4 md:p-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return <AdminDashboard brands={brands.data || []} submissions={submissions.data || []} files={files.data || []} />
}
