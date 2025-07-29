import { createAdminClient } from "@/utils/supabase/server"
import { BrandGrid } from "@/components/brand-grid"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FileQuestion, Wrench } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

async function getActiveBrands() {
  const supabase = createAdminClient()
  try {
    // This query is safe and only selects columns needed for the grid.
    const { data, error } = await supabase
      .from("brands")
      .select("id, name, slug, logo, active")
      .eq("active", true)
      .order("name")

    if (error) {
      console.error("Error fetching active brands for homepage:", error)
      // Return empty array on error so the page can still render a message.
      return []
    }
    return data || []
  } catch (error) {
    console.error("Critical error fetching brands:", error)
    return []
  }
}

export default async function HomePage() {
  const brands = await getActiveBrands()

  return (
    <main className="relative min-h-screen bg-gray-50 p-4 sm:p-6 md:p-8">
      <div className="absolute top-4 right-4 z-10">
        <Button asChild variant="outline" size="sm">
          <Link href="/admin">
            <Wrench className="mr-2 h-4 w-4" />
            Admin
          </Link>
        </Button>
      </div>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 tracking-tight sm:text-5xl">Select a Form</h1>
          <p className="mt-3 text-lg text-gray-600">Choose a brand below to start filling out an order form.</p>
        </div>

        {brands.length > 0 ? (
          <BrandGrid brands={brands} />
        ) : (
          <div className="flex justify-center">
            <Alert className="max-w-md bg-yellow-50 border-yellow-300 text-yellow-800">
              <FileQuestion className="h-4 w-4 !text-yellow-700" />
              <AlertDescription>
                No active forms are available at the moment. Please check back later or contact an administrator.
              </AlertDescription>
            </Alert>
          </div>
        )}
      </div>
    </main>
  )
}
