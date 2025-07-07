import { createAdminClient } from "@/lib/supabase/admin"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SubmissionsTable } from "./submissions-table"
import { BrandManagement } from "./brand-management"
import { SystemActions } from "./system-actions"
import type { Submission, Brand, AllowedIp } from "@/lib/types"
import { Toaster } from "@/components/ui/sonner"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { HelpCircle } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function AdminDashboard() {
  const supabase = createAdminClient()

  const { data: submissionsData, error: submissionsError } = await supabase
    .from("submissions")
    .select("*, brands(*)")
    .order("created_at", { ascending: false })

  const { data: brandsData, error: brandsError } = await supabase
    .from("brands")
    .select("*")
    .order("name", { ascending: true })

  const { data: allowedIpsData, error: ipsError } = await supabase
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

  const submissions = submissionsData as Submission[]
  const brands = brandsData as Brand[]
  const allowedIps = allowedIpsData as AllowedIp[]

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
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="submissions">Submissions</TabsTrigger>
              <TabsTrigger value="brands">Brands</TabsTrigger>
              <TabsTrigger value="system">System</TabsTrigger>
            </TabsList>
            <TabsContent value="submissions" className="mt-6">
              <SubmissionsTable initialSubmissions={submissions || []} />
            </TabsContent>
            <TabsContent value="brands" className="mt-6">
              <BrandManagement initialBrands={brands || []} uploadedFiles={[]} />
            </TabsContent>
            <TabsContent value="system" className="mt-6">
              <SystemActions allowedIps={allowedIps || []} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <Toaster richColors />
    </>
  )
}
