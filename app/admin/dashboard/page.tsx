import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import AdminBrandGrid from "./admin-brand-grid"
import { createAdminClient } from "@/lib/supabase/admin"
import type { Brand, UploadedFile, Submission } from "@/lib/types"
import SubmissionsTable from "./submissions-table"
import DashboardFileManager from "./file-manager"
import SystemActions from "./system-actions"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { HelpCircle } from "lucide-react"
import { Toaster } from "sonner"

async function getBrands(): Promise<Brand[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase.from("brands").select("*").order("name", { ascending: true })
  if (error) {
    console.error("Error fetching brands:", error)
    return []
  }
  return data
}

async function getSubmissions(): Promise<Submission[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("submissions")
    .select("*, brands(name)")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching submissions:", error)
    return []
  }
  return data
}

async function getFiles(): Promise<UploadedFile[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase.from("uploaded_files").select("*").order("uploaded_at", { ascending: false })
  if (error) {
    console.error("Error fetching files:", error)
    return []
  }
  return data
}

export default async function AdminDashboard() {
  const brands = await getBrands()
  const submissions = await getSubmissions()
  const files = await getFiles()

  return (
    <>
      <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
            <Button asChild variant="outline">
              <Link href="/admin/instructions">
                <HelpCircle className="mr-2 h-4 w-4" />
                Admin Guide
              </Link>
            </Button>
          </div>

          <Tabs defaultValue="brands" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="brands">Brands</TabsTrigger>
              <TabsTrigger value="submissions">Submissions</TabsTrigger>
              <TabsTrigger value="files">Files</TabsTrigger>
              <TabsTrigger value="system">System Actions</TabsTrigger>
            </TabsList>
            <TabsContent value="brands" className="mt-6">
              <AdminBrandGrid initialBrands={brands} uploadedFiles={files} />
            </TabsContent>
            <TabsContent value="submissions" className="mt-6">
              <SubmissionsTable initialSubmissions={submissions} brands={brands} />
            </TabsContent>
            <TabsContent value="files" className="mt-6">
              <DashboardFileManager initialFiles={files} />
            </TabsContent>
            <TabsContent value="system" className="mt-6">
              <SystemActions />
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <Toaster richColors />
    </>
  )
}
