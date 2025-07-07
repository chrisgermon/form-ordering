import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getSubmissions, getBrands, getAllowedIps, getMigrationScripts } from "./actions"
import { SubmissionsTable } from "./submissions-table"
import { BrandManagement } from "./brand-management"
import { SystemActions } from "./system-actions"

export default async function AdminDashboard() {
  // Fetch all data in parallel
  const [submissions, brands, allowedIps, scriptFiles] = await Promise.all([
    getSubmissions(),
    getBrands(),
    getAllowedIps(),
    getMigrationScripts(),
  ])

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      <Tabs defaultValue="submissions" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="submissions">Submissions</TabsTrigger>
          <TabsTrigger value="brands">Brand Management</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>
        <TabsContent value="submissions" className="mt-4">
          <SubmissionsTable submissions={submissions} />
        </TabsContent>
        <TabsContent value="brands" className="mt-4">
          <BrandManagement brands={brands} />
        </TabsContent>
        <TabsContent value="system" className="mt-4">
          <SystemActions allowedIps={allowedIps} scriptFiles={scriptFiles} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
