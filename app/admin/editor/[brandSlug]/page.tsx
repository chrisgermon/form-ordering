import { getBrandForEditor } from "./actions"
import FormEditor from "./form-editor"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function FormEditorPage({ params }: { params: { brandSlug: string } }) {
  const { brand, error } = await getBrandForEditor(params.brandSlug)

  if (error) {
    return (
      <div className="container mx-auto py-10">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error Loading Editor</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button asChild variant="outline" className="mt-4 bg-transparent">
          <Link href="/admin">Return to Dashboard</Link>
        </Button>
      </div>
    )
  }

  if (!brand) {
    return (
      <div className="container mx-auto py-10">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>Brand data could not be loaded.</AlertDescription>
        </Alert>
      </div>
    )
  }

  return <FormEditor initialBrand={brand} />
}
