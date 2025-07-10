import { getBrand, getUploadedFiles } from "./actions"
import { FormEditor } from "./form-editor"
import { notFound } from "next/navigation"
import { Toaster } from "@/components/ui/sonner"

export default async function FormEditorPage({ params }: { params: { brandSlug: string } }) {
  const brandData = await getBrand(params.brandSlug)
  const uploadedFiles = await getUploadedFiles()

  if (!brandData) {
    notFound()
  }

  return (
    <>
      <FormEditor initialBrandData={brandData} uploadedFiles={uploadedFiles} />
      <Toaster />
    </>
  )
}
