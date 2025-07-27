import Link from "next/link"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { BrandGrid } from "@/components/brand-grid"
import type { Brand } from "@/lib/types"
import { Package2 } from "lucide-react"
import { redirect } from "next/navigation"

export const revalidate = 60 // Revalidate every 60 seconds

async function getBrands(): Promise<Brand[]> {
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase.from("brands").select("id, name, slug, logo").eq("active", true).order("name")

  if (error) {
    console.error("Error fetching brands:", error)
    throw new Error(`Failed to fetch brands. Please try again later.`)
  }
  return data || []
}

export default async function HomePage() {
  const supabase = createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    return redirect("/admin")
  }

  let brands: Brand[] = []
  let fetchError: string | null = null
  try {
    brands = await getBrands()
  } catch (error) {
    fetchError = error instanceof Error ? error.message : "An unknown error occurred."
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="px-4 lg:px-6 h-16 flex items-center border-b bg-white dark:bg-gray-950">
        <Link href="/" className="flex items-center justify-center">
          <Package2 className="h-6 w-6" />
          <span className="sr-only">Order Forms</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link
            href="/"
            className="text-sm font-medium hover:underline underline-offset-4 text-gray-600 dark:text-gray-400"
          >
            Brands
          </Link>
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  Select a Brand to Create an Order
                </h1>
                <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
                  Choose from the available brands below to start your printing order.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 py-12 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3">
              {fetchError ? (
                <p className="col-span-full text-center text-red-500">{fetchError}</p>
              ) : (
                <BrandGrid brands={brands} />
              )}
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t bg-white dark:bg-gray-950">
        <p className="text-xs text-gray-500 dark:text-gray-400">&copy; 2024 Order Forms. All rights reserved.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link href="/admin" className="text-xs hover:underline underline-offset-4">
            Admin Panel
          </Link>
        </nav>
      </footer>
    </div>
  )
}
