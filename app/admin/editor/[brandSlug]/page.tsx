import { getBrandForEditor } from "./actions"
import { FormEditor } from "./form-editor"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"

export default async function FormEditorPage({ params }: { params: { brandSlug: string } }) {
  const brand = await getBrandForEditor(params.brandSlug)

  if (!brand) {
    return (
      <div className="container mx-auto p-4">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error Loading Form</AlertTitle>
          <AlertDescription>
            Could not load the form configuration for this brand. Please check the slug and try again.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return <FormEditor initialBrand={brand} />
}
