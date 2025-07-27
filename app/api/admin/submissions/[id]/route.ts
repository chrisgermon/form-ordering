import { type NextRequest, NextResponse } from "next/server"
import { createAdminSupabaseClient } from "@/lib/supabase/server"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { delivery_details, expected_delivery_date } = await request.json()

    const supabase = createAdminSupabaseClient()

    const { data, error } = await supabase
      .from("submissions")
      .update({
        status: "completed",
        delivery_details,
        expected_delivery_date,
        completed_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .select()
      .single()

    if (error) {
      console.error("Error updating submission:", error)
      return NextResponse.json({ error: "Failed to update submission" }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error processing request:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
