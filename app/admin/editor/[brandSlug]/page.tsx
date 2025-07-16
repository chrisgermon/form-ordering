import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Terminal } from "lucide-react"
import type { BrandData } from "@/lib/types"
import FormEditor from "./form-editor"

async function getBrandData(slug: string): Promise<{ brand: BrandData | null; error: string | null }> {
  try {
    // Ensure NEXT_PUBLIC_APP_URL is set in your environment variables
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || ""
    const res = await fetch(`${appUrl}/api/admin/brands/${slug}`, {
      cache: "no-store",
    })

    const data = await res.json()

    if (!res.ok) {
      return { brand: null, error: data.error || "Failed to fetch brand data" }
    }

    return { brand: data, error: null }
  } catch (e) {
    const error = e instanceof Error ? e.message : "An unknown error occurred"
    console.error("Error in getBrandData:", error)
    return { brand: null, error }
  }
}

export default async function FormEditorPage({ params }: { params: { brandSlug: string } }) {
  const { brand, error } = await getBrandData(params.brandSlug)

  if (error) {
    if (error.includes("Could not find a relationship between 'brands' and 'clinic_locations'")) {
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
          <AlertTitle>Error Loading Brand</AlertTitle>
          <AlertDescription>
            <p>There was an error loading the data for this brand.</p>
            <pre className="mt-2 whitespace-pre-wrap rounded-md bg-slate-950 p-4 text-sm text-slate-50">
              <code>{error}</code>
            </pre>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!brand) {
    return <div>Brand not found.</div>
  }

  return <FormEditor initialBrand={brand} />
}
