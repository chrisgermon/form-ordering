import { NextResponse } from "next/server"
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

    if (error) throw error

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
    return NextResponse.json({ error: "Failed to fetch submissions" }, { status: 500 })
  }
}
