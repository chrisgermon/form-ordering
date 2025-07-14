import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"

export async function GET() {
  try {
    const supabase = createServerSupabaseClient()
    const { data, error } = await supabase
      .from("submissions")
      .select(
        `
        *,
        brand:brands (
          name
        )
      `,
      )
      .order("created_at", { ascending: false })

    if (error) throw error

    // Manually map brand name to top-level for easier client-side access
    const submissionsWithBrandName = data.map((submission) => ({
      ...submission,
      brand_name: submission.brand?.name || "N/A",
    }))

    return NextResponse.json(submissionsWithBrandName)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch submissions"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { ids } = await request.json()

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "Submission IDs are required" }, { status: 400 })
    }

    const { error } = await supabase.from("submissions").delete().in("id", ids)

    if (error) {
      console.error("Error deleting submissions:", error)
      throw error
    }

    return NextResponse.json({ message: `${ids.length} submission(s) deleted successfully.` })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to delete submissions"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
