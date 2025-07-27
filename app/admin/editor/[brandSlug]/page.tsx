import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import FormEditor from "./form-editor"
import { checkUserPermissions } from "@/lib/auth"
import type { Brand, UploadedFile } from "@/lib/types"

export default async function FormEditorPage({ params }: { params: { brandSlug: string } }) {
  await checkUserPermissions()
  const supabase = createClient()

  const { data: brand, error } = await supabase
    .from("brands")
    .select(
      `
      *,
      product_sections:product_sections(*)
    `,
    )
    .eq("slug", params.brandSlug)
    .single()

  if (error || !brand) {
    console.error("Error fetching brand", error)
    notFound()
  }

  const { data: uploadedFilesData, error: filesError } = await supabase.storage.from("logos").list(brand.id, {
    limit: 100,
  })

  if (filesError) {
    console.error("Error fetching uploaded files", filesError)
  }

  const uploadedFiles: UploadedFile[] = (uploadedFilesData || []).map((file) => ({
    name: file.name,
    url: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/logos/${brand.id}/${file.name}`,
  }))

  const typedBrand: Brand = brand as any

  return <FormEditor initialBrandData={typedBrand} uploadedFiles={uploadedFiles} />
}
