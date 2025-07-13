import { createClient } from "@/utils/supabase/server"
import { FormEditor } from "./form-editor"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import type { BrandData } from "@/lib/types"

export const dynamic = "force-dynamic"

export default async function FormEditorPage({ params }: { params: { brandSlug: string } }) {
  const supabase = createClient()

  const { data: brandData, error } = await supabase
    .from("brands")
    .select(
      `
      *,
      sections (
        *,
        items (
          *,
          options (*)
        )
      )
    `,
    )
    .eq("slug", params.brandSlug)
    .order("position", { foreignTable: "sections", ascending: true })
    .order("position", { foreignTable: "items", ascending: true })
    .order("sort_order", { foreignTable: "sections.items.options", ascending: true })
    .single()

  if (error || !brandData) {
    console.error(`Error fetching form data for brand '${params.brandSlug}':`, error?.message)
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardHeader>
            <CardTitle>Error Loading Form</CardTitle>
            <CardDescription>Could not load the form configuration for this brand.</CardDescription>
          </CardHeader>
          <CardContent>
            <p>There was an issue fetching the data from the database.</p>
            <p className="text-sm text-muted-foreground mt-2">
              <strong>Details:</strong> {error?.message || "Brand not found."}
            </p>
            <Button asChild className="mt-4">
              <Link href="/admin">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Admin Dashboard
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <FormEditor initialBrandData={brandData as BrandData} />
}
