import { getActiveBrands } from "@/lib/db"
import { BrandGrid } from "@/components/brand-grid"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function HomePage() {
  const brands = await getActiveBrands()

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="p-4 sm:p-8">
        <div className="max-w-7xl mx-auto">
          <header className="flex justify-between items-center py-4 mb-8">
            <div className="flex items-center gap-4">
              <Image src="/favicon.png" alt="VRG Logo" width={40} height={40} />
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Printing Order System</h1>
            </div>
            <Button asChild variant="outline">
              <Link href="/admin/dashboard">Admin Dashboard</Link>
            </Button>
          </header>

          <div className="text-center mb-12">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-700 mb-2">Select a Brand to Begin</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              Choose one of the brands below to access their dedicated printing order form.
            </p>
          </div>

          {brands.length > 0 ? (
            <BrandGrid brands={brands} />
          ) : (
            <div className="text-center py-16 bg-white rounded-lg shadow-sm">
              <p className="text-gray-600 font-semibold">No active brands found.</p>
              <p className="text-sm text-gray-500 mt-2">
                Please go to the{" "}
                <Link href="/admin/dashboard" className="text-blue-600 hover:underline">
                  admin dashboard
                </Link>{" "}
                to activate brands.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
