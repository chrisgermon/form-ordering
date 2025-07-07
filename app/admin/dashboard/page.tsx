import { createAdminClient } from "@/lib/supabase/admin"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SubmissionsTable } from "./submissions-table"
import { BrandManagement } from "./brand-management"
import { SystemActions } from "./system-actions"
import type { Submission, Brand, AllowedIp } from "@/lib/types"

export const dynamic = "force-dynamic"

export default async function AdminDashboard() {
  const supabase = createAdminClient()

  const { data: submissions, error: submissionsError } = await supabase
    .from("submissions")
    .select("*, brands(*)")
    .order("created_at", { ascending: false })

  const { data: brands, error: brandsError } = await supabase
    .from("brands")
    .select("*")
    .order("name", { ascending: true })

  const { data: allowedIps, error: ipsError } = await supabase
    .from("allowed_ips")
    .select("*")
    .order("created_at", { ascending: false })

  if (submissionsError || brandsError || ipsError) {
    console.error("Dashboard data fetch error:", { submissionsError, brandsError, ipsError })
    return (
      <div className="text-red-500 p-4">
        Error loading dashboard data. Please check the console and try again later.
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      <Tabs defaultValue="submissions">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="submissions">Submissions</TabsTrigger>
          <TabsTrigger value="brands">Brand Management</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>
        <TabsContent value="submissions" className="mt-4">
          <SubmissionsTable submissions={(submissions as Submission[]) || []} />
        </TabsContent>
        <TabsContent value="brands" className="mt-4">
          <BrandManagement brands={(brands as Brand[]) || []} allowedIps={(allowedIps as AllowedIp[]) || []} />
        </TabsContent>
        <TabsContent value="system" className="mt-4">
          <SystemActions />
        </TabsContent>
      </Tabs>
    </div>
  )
}
