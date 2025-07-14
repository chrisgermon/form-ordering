import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("submissions")
      .select(
        `
        id,
        created_at,
        brand_id,
        ordered_by,
        email,
        deliver_to,
        bill_to,
        items,
        status,
        pdf_url,
        order_number,
        completed_at,
        delivery_details,
        expected_delivery_date,
        brands (name)
      `,
      )
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching submissions:", error)
      throw error
    }

    const submissions = data.map((s: any) => ({
      ...s,
      brand_name: s.brands?.name || "Unknown Brand",
    }))

    return NextResponse.json(submissions)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch submissions" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { ids } = await request.json()

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "Invalid or empty submission IDs provided." }, { status: 400 })
    }

    const { error } = await supabase.from("submissions").delete().in("id", ids)

    if (error) {
      console.error("Error deleting submissions:", error)
      throw error
    }

    return NextResponse.json({ message: `${ids.length} submission(s) deleted successfully.` })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json({ error: `Failed to delete submissions: ${errorMessage}` }, { status: 500 })
  }
}
