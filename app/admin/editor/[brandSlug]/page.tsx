import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Terminal } from "lucide-react"
import type { BrandData } from "@/lib/types"
import FormEditor from "./form-editor"
import { createAdminClient } from "@/utils/supabase/server"
import { notFound } from "next/navigation"

export default async function FormEditorPage({ params }: { params: { brandSlug: string } }) {
  const supabase = createAdminClient()
  const { data: brand, error } = await supabase
    .from("brands")
    .select(
      `
    *,
    clinic_locations(*),
    sections(
      *,
      items(
        *,
        options(*)
      )
    )
  `,
    )
    .eq("slug", params.brandSlug)
    .order("position", { foreignTable: "sections" })
    .order("position", { foreignTable: "sections.items" })
    .order("sort_order", { foreignTable: "sections.items.options" })
    .single()

  if (error) {
    console.error("Error fetching brand for editor:", error)
    if (error.message.includes("Could not find a relationship between 'brands' and 'clinic_locations'")) {
      return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
          <Alert variant="destructive">
            <Terminal className="h-4 w-4" />
            <AlertTitle>Database Schema Mismatch</AlertTitle>
            <AlertDescription>
              <p className="mb-4">
                The application can't fetch clinic locations because the database relationship is missing or not
                recognized. This is a critical error that needs to be fixed by updating your database schema.
              </p>
              <p className="font-semibold">To fix this, please run the latest SQL script in your Supabase project:</p>
              <ol className="list-decimal list-inside my-2 space-y-1">
                <li>
                  Navigate to the{" "}
                  <a
                    href="https://supabase.com/dashboard"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-primary underline underline-offset-4"
                  >
                    Supabase Dashboard
                  </a>
                  , select your project, and go to the <strong>SQL Editor</strong>.
                </li>
                <li>
                  Copy the entire contents of the file: <code>scripts/21-ensure-clinic-locations-relationship.sql</code>
                </li>
                <li>
                  Paste the SQL into the editor and click <strong>"Run"</strong>.
                </li>
              </ol>
              <p>
                This will correctly configure the table relationships and allow the application to work as expected.
                After running the script, please refresh this page.
              </p>
            </AlertDescription>
          </Alert>
        </div>
      )
    }
    return (
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <Alert variant="destructive">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Database Error</AlertTitle>
          <AlertDescription>
            <p>Could not fetch brand data. This might be due to a database schema issue.</p>
            <p className="mt-2 font-mono text-xs">{error.message}</p>
            <p className="mt-4">
              Please ensure all database migration scripts have been run correctly in your Supabase SQL editor.
            </p>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!brand) {
    notFound()
  }

  return <FormEditor initialBrand={brand as BrandData} />
}
