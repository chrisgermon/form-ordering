import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getAllBrands, getSubmissions, getUploadedFiles } from "@/lib/db"
import { BrandManagement } from "./brand-management"
import { SubmissionsTable } from "./submissions-table"
import { SystemActions } from "./system-actions"
import { FileManager } from "./file-manager"
import { Toaster } from "sonner"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { HelpCircle } from "lucide-react"

export default async function AdminDashboard() {
  const [brands, submissions, uploadedFiles] = await Promise.all([getAllBrands(), getSubmissions(), getUploadedFiles()])

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

          <Tabs defaultValue="submissions" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="submissions">Submissions</TabsTrigger>
              <TabsTrigger value="brands">Brands</TabsTrigger>
              <TabsTrigger value="files">Global Files</TabsTrigger>
              <TabsTrigger value="system">System</TabsTrigger>
            </TabsList>
            <TabsContent value="submissions" className="mt-6">
              <SubmissionsTable initialSubmissions={submissions || []} />
            </TabsContent>
            <TabsContent value="brands" className="mt-6">
              <BrandManagement initialBrands={brands || []} uploadedFiles={uploadedFiles || []} />
            </TabsContent>
            <TabsContent value="files" className="mt-6">
              <FileManager initialFiles={uploadedFiles || []} />
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
