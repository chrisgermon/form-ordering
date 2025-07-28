import { createAdminSupabaseClient } from "@/lib/supabase/server"
import { FormEditor } from "./form-editor"
import type { Brand, ProductSection, ProductItem } from "@/lib/types"
import { notFound } from "next/navigation"
import Link from "next/link"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"

export type BrandForEditor = Brand & {
  product_sections: (ProductSection & {
    product_items: ProductItem[]
  })[]
}

async function getBrandData(slug: string): Promise<BrandForEditor | null> {
  if (slug === "new") {
    return {
      id: "",
      name: "",
      slug: "",
      logo: "",
      email: "",
      active: true,
      clinics: [],
      product_sections: [],
      created_at: "",
    }
  }

  const supabase = createAdminSupabaseClient()
  const { data, error } = await supabase
    .from("brands")
    .select("*, product_sections(*, product_items(*))")
    .eq("slug", slug)
    .single()

  if (error || !data) {
    console.error("Error fetching brand:", error)
    return null
  }

  // Sort sections and items by their sort_order
  data.product_sections.sort((a, b) => a.sort_order - b.sort_order)
  data.product_sections.forEach((section) => {
    section.product_items.sort((a, b) => a.sort_order - b.sort_order)
  })

  return data as BrandForEditor
}

export default async function BrandEditorPage({ params }: { params: { brandSlug: string } }) {
  const brandData = await getBrandData(params.brandSlug)

  if (!brandData) {
    notFound()
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:px-6">
        <Link href="/admin">
          <Button variant="outline" size="icon" className="h-7 w-7 bg-transparent">
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Button>
        </Link>
        <Breadcrumb className="hidden md:flex">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/admin">Admin</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{brandData.name || "New Brand"}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>
      <main className="flex-1 p-4 sm:px-6 sm:py-0">
        <FormEditor initialData={brandData} />
      </main>
    </div>
  )
}
