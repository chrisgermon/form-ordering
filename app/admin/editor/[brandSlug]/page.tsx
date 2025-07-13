import { getBrandForEditor } from "./actions"
import FormEditor from "./form-editor"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Terminal } from "lucide-react"

export default async function FormEditorPage({ params }: { params: { brandSlug: string } }) {
  const { brand, error } = await getBrandForEditor(params.brandSlug)

  if (error) {
    return (
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <Alert variant="destructive">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Error Loading Editor</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  // This case should be covered by the error handling above, but as a fallback:
  if (!brand) {
    return (
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <Alert variant="destructive">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>The brand could not be loaded, and no specific error was provided.</AlertDescription>
        </Alert>
      </div>
    )
  }

  return <FormEditor initialBrand={brand} />
}
