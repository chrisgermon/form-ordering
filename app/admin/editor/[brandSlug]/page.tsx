import { createClient } from "@/utils/supabase/server"
import { notFound } from "next/navigation"
import FormEditor from "./form-editor"
import { FileManager } from "@/app/admin/FileManager"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Toaster } from "@/components/ui/sonner"

export default async function BrandEditorPage({ params }: { params: { brandSlug: string } }) {
  const supabase = createClient()
  const { data: brand, error: brandError } = await supabase
    .from("brands")
    .select("id, name, slug")
    .eq("slug", params.brandSlug)
    .single()

  if (brandError || !brand) {
    console.error("Error fetching brand:", brandError)
    notFound()
  }

  const { data: sections, error: sectionsError } = await supabase
    .from("sections")
    .select("*, items(*, options(*))")
    .eq("brand_id", brand.id)
    .order("position", { ascending: true })
    .order("position", { foreignTable: "items", ascending: true })

  if (sectionsError) {
    console.error("Error fetching sections:", sectionsError)
    // We can still render the page with an empty array of sections
  }

  return (
    <>
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-2">{brand.name} Editor</h1>
        <p className="text-muted-foreground mb-6">Manage the form structure and files for this brand.</p>

        <Tabs defaultValue="form-editor">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="form-editor">Form Editor</TabsTrigger>
            <TabsTrigger value="file-manager">File Manager</TabsTrigger>
          </TabsList>
          <TabsContent value="form-editor" className="mt-4">
            <FormEditor initialSections={sections || []} brandId={brand.id} />
          </TabsContent>
          <TabsContent value="file-manager" className="mt-4">
            <FileManager brandId={brand.id} />
          </TabsContent>
        </Tabs>
      </div>
      <Toaster richColors />
    </>
  )
}
