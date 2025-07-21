import { createClient } from "@/utils/supabase/server"
import { NextResponse } from "next/server"

export const revalidate = 0

export async function GET() {
  const supabase = createClient()
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

    const formattedData = data?.map((s) => ({
      ...s,
      brand_name: s.brands?.name || "Unknown Brand",
    }))

    return new NextResponse(JSON.stringify(formattedData || []), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json({ error: "Failed to fetch submissions", details: errorMessage }, { status: 500 })
  }
}
