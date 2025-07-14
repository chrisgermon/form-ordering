import { createClient } from "@/utils/supabase/server"
import { notFound } from "next/navigation"
import Image from "next/image"
import { BrandForm } from "./form"
import type { BrandData } from "@/lib/types"

export const revalidate = 0

export default async function BrandFormPage({ params }: { params: { brandSlug: string } }) {
  const supabase = createClient()

  const { data: brand, error } = await supabase
    .from("brands")
    .select(
      `
      *,
      clinic_locations (*),
      sections (
        *,
        items (
          *,
          options (*)
        )
      )
    `,
    )
    .eq("slug", params.brandSlug)
    .eq("active", true)
    .single<BrandData>()

  if (error || !brand) {
    console.error("Error fetching brand:", error?.message)
    notFound()
  }

  // Sort sections and items by their position
  brand.sections.sort((a, b) => a.position - b.position)
  brand.sections.forEach((section) => {
    section.items.sort((a, b) => a.position - b.position)
    section.items.forEach((item) => {
      if (item.options) {
        item.options.sort((a, b) => a.sort_order - b.sort_order)
      }
    })
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {brand.logo_url ? (
              <Image
                src={brand.logo_url || "/placeholder.svg"}
                alt={`${brand.name} Logo`}
                width={160}
                height={40}
                className="object-contain h-10 w-auto"
                priority
              />
            ) : (
              <div className="h-10" />
            )}
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-800 text-center">{brand.name} Order Form</h1>
          <div className="w-[160px]" /> {/* Spacer */}
        </div>
      </header>
      <main className="container mx-auto p-4 md:p-8">
        <BrandForm brand={brand} />
      </main>
      <footer className="py-4 text-center text-sm text-gray-500">
        <p>
          &copy; {new Date().getFullYear()} {brand.name}. All rights reserved.
        </p>
      </footer>
    </div>
  )
}
