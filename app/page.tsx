import { BrandGrid } from "@/components/brand-grid"
import { createServerSupabaseClient } from "@/lib/supabase"
import type { Brand } from "@/lib/types"
import Link from "next/link"

export const revalidate = 3600 // revalidate at most every hour

export default async function HomePage() {
  const supabase = createServerSupabaseClient()
  const { data: brands, error } = await supabase
    .from("brands")
    .select("id, name, slug, logo")
    .eq("active", true)
    .order("name", { ascending: true })

  if (error) {
    console.error("Error fetching brands:", error.message)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-500">Could not load brands. Please try again later.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                  Printing Order Forms
                </h1>
                <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
                  Select a brand to create a new printing order.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 py-12 sm:grid-cols-2 md:grid-cols-3 lg:gap-12">
              <BrandGrid brands={(brands as Brand[]) || []} />
            </div>
          </div>
        </section>
      </main>
      <footer className="flex items-center justify-center w-full h-24 border-t bg-white dark:bg-gray-950">
        <div className="container flex justify-between items-center px-4 md:px-6">
          <p className="text-gray-500 dark:text-gray-400">© 2024 Printing Services Inc.</p>
          <Link
            href="/admin"
            className="text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50"
          >
            Admin Panel
          </Link>
        </div>
      </footer>
    </div>
  )
}
