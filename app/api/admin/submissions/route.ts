import { createAdminClient } from "@/utils/supabase/server"
import { NextResponse } from "next/server"

export const revalidate = 0

export async function GET() {
  const supabase = createAdminClient()
  try {
    const { data, error } = await supabase
      .from("submissions")
      .select(
        `
        id,
        created_at,
        ordered_by,
        ordered_by_email,
        status,
        brand_id,
        brands (
          name
        )
        `,
      )
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching submissions:", error)
      throw new Error(error.message)
    }

    // The data from the query has brands as an object, e.g., { name: 'Brand Name' }
    // We need to flatten this for easier use in the client component.
    const formattedData = data?.map((s) => ({
      ...s,
      brand_name: s.brands?.name || "Unknown Brand",
    }))

    return NextResponse.json(formattedData)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json({ error: "Failed to fetch submissions", details: errorMessage }, { status: 500 })
  }
}
