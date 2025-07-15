import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"

export async function GET() {
  const supabase = createServerSupabaseClient()
  try {
    const { data, error } = await supabase
      .from("submissions")
      .select(
        `
        *,
        brand:brands (
          name
        )
      `
      )
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching submissions:", error)
      throw error
    }

    // Manually map brand name to top-level for easier client-side access
    const submissionsWithBrandName = data.map((submission: any) => ({
      ...submission,
      brand_name: submission.brand?.name || "Unknown Brand",
      brand: undefined, // remove the nested brand object
    }))

    return NextResponse.json(submissionsWithBrandName)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch submissions" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const supabase = createServerSupabaseClient()
  try {
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
    return NextResponse.json({ error: "Failed to delete submissions" }, { status: 500 })
  }
}
