import { createClient } from "@/lib/supabase/server"
import BrandGrid from "@/components/brand-grid"
import type { Brand } from "@/lib/types"

export default async function HomePage() {
  const supabase = createClient()
  const { data: brands, error } = await supabase.from("brands").select("*").order("name")

  if (error) {
    console.error("Error fetching brands for homepage:", error)
    return <div>Could not load brands. Please try again later.</div>
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight lg:text-5xl">Radiology Order Forms</h1>
        <p className="text-lg text-muted-foreground mt-2">Select a brand to start creating an order.</p>
      </div>
      <BrandGrid brands={brands as Brand[]} />
    </main>
  )
}
