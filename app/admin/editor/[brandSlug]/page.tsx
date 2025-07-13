import Link from "next/link"
import { Button } from "@/components/ui/button"
import { createClient } from "@/utils/supabase/server"
import { notFound } from "next/navigation"
import { FormEditor } from "./form-editor"
import { FileManager } from "@/app/admin/FileManager"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Toaster } from "@/components/ui/sonner"
import type { BrandData } from "@/lib/types"

async function getBrandData(slug: string): Promise<BrandData> {
  const supabase = createClient()
  const { data: brand, error } = await supabase
    .from("brands")
    .select(
      `
      id, name, slug, logo_url, emails, clinic_locations, active,
      sections (
        *,
        items (
          *,
          options (*)
        )
      )
    `,
    )
    .eq("slug", slug)
    .single()

  if (error || !brand) {
    console.error(`Error fetching brand for editor: ${slug}`, error?.message)
    notFound()
  }

  // Ensure sections and items are sorted by position
  const sortedSections = (brand.sections || []).sort((a, b) => a.position - b.position)
  sortedSections.forEach((section) => {
    if (section.items) {
      section.items.sort((a, b) => a.position - b.position)
    } else {
      section.items = [] // Ensure items is always an array
    }
  })

  return { ...brand, sections: sortedSections } as BrandData
}

export default async function EditorPage({ params }: { params: { brandSlug: string } }) {
  const brandData = await getBrandData(params.brandSlug)

  return (
    <>
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">{brandData.name}</h1>
            <p className="text-muted-foreground">Manage the form structure and files for this brand.</p>
          </div>
          <Button asChild variant="outline">
            <Link href="/admin">Back to Dashboard</Link>
          </Button>
        </div>

        <Tabs defaultValue="form-editor" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="form-editor">Form Editor</TabsTrigger>
            <TabsTrigger value="file-manager">File Manager</TabsTrigger>
          </TabsList>
          <TabsContent value="form-editor" className="mt-6">
            <FormEditor initialBrandData={brandData} />
          </TabsContent>
          <TabsContent value="file-manager" className="mt-6">
            <FileManager brandId={brandData.id} />
          </TabsContent>
        </Tabs>
      </div>
      <Toaster richColors />
    </>
  )
}
