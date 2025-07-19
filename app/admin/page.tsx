import { createClient } from "@/utils/supabase/server"
import AdminDashboard from "./AdminDashboard"
import type { Brand, Submission, File } from "@/lib/types"

async function getBrands(): Promise<Brand[]> {
  const supabase = createClient()
  const { data, error } = await supabase.from("brands").select("*").order("name")
  if (error) {
    console.error("Error fetching brands:", error)
    return []
  }
  return (data as Brand[]) || []
}

async function getSubmissions(): Promise<Submission[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("submissions")
    .select("*, brands(name, slug)")
    .order("created_at", { ascending: false })
  if (error) {
    console.error("Error fetching submissions:", error)
    return []
  }
  // The type assertion is necessary because Supabase's auto-generated types
  // might not perfectly match the nested structure we're selecting.
  return (data as unknown as Submission[]) || []
}

async function getFiles(): Promise<File[]> {
  const supabase = createClient()
  const { data, error } = await supabase.from("files").select("*").order("created_at", { ascending: false })
  if (error) {
    console.error("Error fetching files:", error)
    return []
  }
  return (data as File[]) || []
}

export default async function AdminPage() {
  const brands = await getBrands()
  const submissions = await getSubmissions()
  const files = await getFiles()

  return <AdminDashboard initialBrands={brands} initialSubmissions={submissions} initialFiles={files} />
}
