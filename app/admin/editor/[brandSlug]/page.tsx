import { createClient } from "@/lib/supabase/server"
import { checkUserPermissions } from "@/lib/auth"
import FormEditor from "./form-editor"
import type { Brand, UploadedFile } from "@/lib/types"
import { notFound } from "next/navigation"

export default async function FormEditorPage({ params }: { params: { brandSlug: string } }) {
  await checkUserPermissions()
  const supabase = createClient()

  const { data: brandData, error: brandError } = await supabase
    .from("brands")
    .select("*, product_sections(*, product_items(*))")
    .eq("slug", params.brandSlug)
    .single()

  if (brandError || !brandData) {
    console.error("Error fetching brand:", brandError)
    return notFound()
  }

  const { data: uploadedFiles, error: filesError } = await supabase.from("files").select("*")

  if (filesError) {
    console.error("Error fetching files:", filesError)
    // We can still render the page even if files fail to load
  }

  return <FormEditor initialBrandData={brandData as Brand} uploadedFiles={(uploadedFiles as UploadedFile[]) || []} />
}
