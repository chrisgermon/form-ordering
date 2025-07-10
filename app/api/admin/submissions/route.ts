import { createServerSupabaseClient } from "@/lib/supabase"
import { NextResponse } from "next/server"

export const revalidate = 0

export async function GET() {
  const supabase = createServerSupabaseClient()
  try {
    const { data, error } = await supabase
      .from("submissions")
      .select(
        `
        id,
        created_at,
        ordered_by,
        email,
        status,
        pdf_url,
        ip_address,
        brands (
          name,
          primary_color
        )
      `,
      )
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching submissions:", error)
      throw new Error(error.message)
    }

    return NextResponse.json(data)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json({ error: "Failed to fetch submissions", details: errorMessage }, { status: 500 })
  }
}
