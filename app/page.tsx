import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function HomePage() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return redirect("/login")
  }

  // Since there is no login, we redirect directly to the admin dashboard.
  redirect("/admin")

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex h-16 items-center justify-between border-b bg-white px-6">
        <h1 className="text-lg font-semibold">Form Ordering System</h1>
        <div className="flex items-center gap-4">
          <span>{user.email}</span>
          <form action="/auth/signout" method="post">
            <Button type="submit" variant="outline">
              Sign Out
            </Button>
          </form>
        </div>
      </header>
      <main className="flex flex-1 flex-col items-center justify-center bg-gray-50 p-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold">Welcome back!</h2>
          <p className="mt-2 text-lg text-gray-600">Manage your brands and order forms from here.</p>
          <div className="mt-8">
            <Button asChild size="lg">
              <Link href="/brands">Go to My Brands</Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
