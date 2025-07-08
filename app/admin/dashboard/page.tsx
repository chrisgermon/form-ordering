import { createAdminClient } from "@/lib/supabase/admin"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BrandGrid } from "@/components/brand-grid"
import { Button } from "@/components/ui/button"
import {
  initializeDatabase,
  runSchemaV5Update,
  forceSchemaReload,
  runClinicImport,
  runSchemaV13Update,
  runSchemaV14Update,
} from "./actions"
import type { Brand, Submission } from "@/lib/types"
import { SubmissionsTable } from "./submissions-table"

export const dynamic = "force-dynamic"

export default async function AdminDashboard() {
  const supabase = createAdminClient()
  const { data: brands, error: brandsError } = await supabase
    .from("brands")
    .select("*")
    .order("name", { ascending: true })

  const { data: submissions, error: submissionsError } = await supabase
    .from("submissions")
    .select("*")
    .order("created_at", { ascending: false })

  if (brandsError) {
    console.error("Error fetching brands:", brandsError)
  }
  if (submissionsError) {
    console.error("Error fetching submissions:", submissionsError)
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      <Tabs defaultValue="brands">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="brands">Brands</TabsTrigger>
          <TabsTrigger value="submissions">Submissions</TabsTrigger>
          <TabsTrigger value="system">System Actions</TabsTrigger>
        </TabsList>

        <TabsContent value="brands">
          <BrandGrid brands={(brands as Brand[]) || []} />
        </TabsContent>

        <TabsContent value="submissions">
          <div className="mt-6">
            <h2 className="text-2xl font-semibold mb-4">Order Submissions</h2>
            <SubmissionsTable
              initialSubmissions={(submissions as Submission[]) || []}
              brands={(brands as Brand[]) || []}
            />
          </div>
        </TabsContent>

        <TabsContent value="system">
          <div className="mt-6 p-6 border rounded-lg bg-gray-50">
            <h2 className="text-2xl font-semibold mb-4">System Actions</h2>
            <p className="text-gray-600 mb-6">Run system-wide actions. Use with caution.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <form action={initializeDatabase}>
                <Button type="submit" variant="destructive" className="w-full">
                  Initialize Database (v1-v4)
                </Button>
              </form>
              <form action={runSchemaV5Update}>
                <Button type="submit" variant="secondary" className="w-full">
                  Run Schema Update (v5)
                </Button>
              </form>
              <form action={runClinicImport}>
                <Button type="submit" variant="secondary" className="w-full">
                  Run Clinic & Logo Import
                </Button>
              </form>
              <form action={runSchemaV13Update}>
                <Button type="submit" variant="secondary" className="w-full">
                  Run Schema Update (v13)
                </Button>
              </form>
              <form action={runSchemaV14Update}>
                <Button type="submit" variant="secondary" className="w-full">
                  Run Schema Update (v14)
                </Button>
              </form>
              <form action={forceSchemaReload}>
                <Button type="submit" variant="outline" className="w-full bg-transparent">
                  Force Schema Reload
                </Button>
              </form>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
