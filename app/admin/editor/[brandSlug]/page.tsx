import { notFound } from "next/navigation"
import { FormEditor } from "./form-editor"
import { getBrandForEditor } from "./actions"

export default async function FormEditorPage({ params }: { params: { brandSlug: string } }) {
  const brand = await getBrandForEditor(params.brandSlug)

  if (!brand) {
    notFound()
  }

  return <FormEditor brand={brand} />
}
