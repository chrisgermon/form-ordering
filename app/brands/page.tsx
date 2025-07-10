import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { createClient } from "@/utils/supabase/server"
import { PlusCircle } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"

export default async function BrandsPage() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return redirect("/login")
  }

  const { data: brands, error } = await supabase
    .from("brands")
    .select("id, name, initials, order_prefix")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching brands:", error)
    // Handle error appropriately
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">My Brands</h1>
          <Button asChild>
            <Link href="/brands/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              Create New Brand
            </Link>
          </Button>
        </div>
      </header>
      <main>
        <div className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {brands && brands.length > 0 ? (
              brands.map((brand) => (
                <Card key={brand.id}>
                  <CardHeader>
                    <CardTitle>{brand.name}</CardTitle>
                    <CardDescription>Order Prefix: {brand.order_prefix}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-xl font-bold text-gray-600">
                      {brand.initials}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <h3 className="text-lg font-medium text-gray-900">No brands found</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by creating a new brand.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
