import { NextResponse, type NextRequest } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"

export async function GET() {
  try {
    const supabase = createServerSupabaseClient()

    const { data: submissions, error } = await supabase
      .from("submissions")
      .select(
        `
        *,
        brands (
          name
        )
      `,
      )
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching submissions:", error)
      throw error
    }

    // The Supabase query returns brand as an object { name: '...' } or null.
    // We'll flatten it for easier use on the client.
    const formattedSubmissions = submissions.map((s: any) => ({
      ...s,
      brand_name: s.brands?.name || "Unknown Brand",
      brands: undefined, // remove the nested object
    }))

    return NextResponse.json(formattedSubmissions)
  } catch (error) {
    console.error("Error fetching submissions:", error)
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
