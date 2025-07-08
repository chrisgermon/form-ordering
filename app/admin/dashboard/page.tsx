import { createAdminClient } from "@/lib/supabase/admin"
import { BrandManagement } from "./brand-management"
import type { Brand, UploadedFile } from "@/lib/types"

async function getBrands(): Promise<Brand[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase.from("brands").select("*").order("name", { ascending: true })
  if (error) {
    console.error("Error fetching brands:", error)
    return []
  }
  return data as Brand[]
}

async function getUploadedFiles(): Promise<UploadedFile[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase.from("uploaded_files").select("*").order("created_at", { ascending: false })
  if (error) {
    console.error("Error fetching uploaded files:", error)
    return []
  }
  return data as UploadedFile[]
}

export default async function AdminDashboardPage() {
  const brands = await getBrands()
  const uploadedFiles = await getUploadedFiles()

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <div className="space-y-8">
        <BrandManagement initialBrands={brands} uploadedFiles={uploadedFiles} />
        {/* Other dashboard components can be added here */}
      </div>
    </div>
  )
}
