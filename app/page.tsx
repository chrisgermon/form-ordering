import { createClient } from "@/lib/supabase/server"
import BrandGrid from "@/components/brand-grid"
import { redirect } from "next/navigation"

export default async function Home() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    return redirect("/admin")
  }

  const { data: brands, error } = await supabase.from("brands").select("*")

  if (error) {
    console.error("Error fetching brands:", error)
    return <p>Error loading brands. Please try again later.</p>
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 md:p-24">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex">
        <div className="container mx-auto">
          <h1 className="mb-8 text-center text-4xl font-bold">Select a Brand to Order Forms</h1>
          <BrandGrid brands={brands || []} />
        </div>
      </div>
    </main>
  )
}
