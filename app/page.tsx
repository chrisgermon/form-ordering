import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import BrandGrid from "@/components/brand-grid"
import { redirect } from "next/navigation"
import type { Brand } from "@/lib/types"
import { Package2 } from "lucide-react"

export default async function Home() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    return redirect("/admin")
  }

  // FIX: Removed the .eq("is_active", true) filter which was causing the error.
  const { data: brands, error } = await supabase.from("brands").select("*").order("name")

  if (error) {
    console.error("Error fetching brands:", error)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <h1 className="text-2xl font-bold text-destructive">Error Fetching Brands</h1>
        <p className="text-muted-foreground mt-2">
          We couldn't load the brand information. It seems there's a database schema mismatch.
        </p>
        <p className="font-mono bg-muted p-2 rounded-md mt-4 text-sm">{error.message}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="px-4 lg:px-6 h-16 flex items-center border-b bg-white dark:bg-gray-950">
        <Link href="/" className="flex items-center justify-center" prefetch={false}>
          <Package2 className="h-6 w-6" />
          <span className="sr-only">Order Forms</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link
            href="/"
            className="text-sm font-medium hover:underline underline-offset-4 text-gray-600 dark:text-gray-400"
            prefetch={false}
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
              <BrandGrid brands={(brands as Brand[]) || []} />
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t bg-white dark:bg-gray-950">
        <p className="text-xs text-gray-500 dark:text-gray-400">&copy; 2024 Order Forms. All rights reserved.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link href="/admin" className="text-xs hover:underline underline-offset-4" prefetch={false}>
            Admin Panel
          </Link>
        </nav>
      </footer>
    </div>
  )
}
