import { FormEditor } from "./form-editor"
import { notFound } from "next/navigation"
import { getBrand, getUploadedFiles } from "./actions"

interface PageProps {
  params: {
    brandSlug: string
  }
}

export default async function BrandEditorPage({ params }: PageProps) {
  const brandData = await getBrand(params.brandSlug)
  const uploadedFiles = await getUploadedFiles()

  if (!brandData) {
    notFound()
  }

  return <FormEditor initialBrandData={brandData} uploadedFiles={uploadedFiles} />
}
