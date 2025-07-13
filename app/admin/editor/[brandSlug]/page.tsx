import Link from "next/link"
import { Button } from "@/components/ui/button"
import { createClient } from "@/utils/supabase/server"
import { notFound } from "next/navigation"
import { FormEditor } from "./form-editor"
import { FileManager } from "@/app/admin/FileManager"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Toaster } from "sonner"
import type { BrandData } from "@/lib/types"

async function getBrandData(slug: string): Promise<BrandData> {
  const supabase = createClient()

  // Step 1: Fetch the brand details
  const { data: brand, error: brandError } = await supabase
    .from("brands")
    .select("id, name, slug, logo_url, emails, clinic_locations, active")
    .eq("slug", slug)
    .single()

  if (brandError || !brand) {
    console.error(`Error fetching brand details for slug '${slug}':`, brandError?.message)
    notFound()
  }

  // Step 2: Fetch the sections for that brand, with nested items and options
  const { data: sections, error: sectionsError } = await supabase
    .from("sections")
    .select(
      `
      *,
      items (
        *,
        options (*)
      )
    `,
    )
    .eq("brand_id", brand.id)
    .order("position", { ascending: true })

  if (sectionsError) {
    console.error(`Error fetching sections for brand '${brand.name}':`, sectionsError.message)
    // Return brand data with empty sections if sections fail to load, preventing a crash
    return { ...brand, sections: [] } as BrandData
  }

  // Step 3: Sort items within each section by their position
  sections.forEach((section) => {
    if (section.items) {
      section.items.sort((a, b) => a.position - b.position)
    }
  })

  return { ...brand, sections } as BrandData
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
