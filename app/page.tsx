import { createClient } from "@/utils/supabase/server"
import BrandGrid from "@/components/brand-grid"

export default async function HomePage() {
  const supabase = createClient()
  const { data: brands, error } = await supabase.from("brands").select("*").eq("active", true)

  if (error) {
    console.error("Error fetching brands:", error)
    // You might want to render an error state here
    return <p>Error loading brands.</p>
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gray-50">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">Printing Order Forms</h1>
        <p className="mt-6 text-lg leading-8 text-gray-600">Select a brand below to start your order.</p>
      </div>
      <BrandGrid brands={brands || []} />
    </main>
  )
}
