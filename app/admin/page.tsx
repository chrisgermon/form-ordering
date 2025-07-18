import { createClient } from "@/utils/supabase/server"
import { SubmissionsClient } from "./submissions-client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export const revalidate = 0 // Ensure fresh data on every load

export default async function AdminDashboardPage() {
  const supabase = createClient()

  const { data: submissions, error: submissionsError } = await supabase
    .from("submissions")
    .select("*, brands(name)")
    .order("created_at", { ascending: false })

  const { data: brands, error: brandsError } = await supabase.from("brands").select("*")

  if (submissionsError || brandsError) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Failed to load data from the database.</p>
            <p className="text-red-500">{submissionsError?.message || brandsError?.message}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 space-y-8">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>
      <SubmissionsClient initialSubmissions={submissions || []} brands={brands || []} />
    </div>
  )
}
