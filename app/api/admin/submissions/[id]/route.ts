import { type NextRequest, NextResponse } from "next/server"
import { createAdminSupabaseClient } from "@/lib/supabase/server"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createAdminSupabaseClient()
    const body = await request.json()
    const { id } = params

    const { delivery_details, expected_delivery_date } = body

    if (!id) {
      return NextResponse.json({ error: "Submission ID is required" }, { status: 400 })
    }

    if (!delivery_details || !expected_delivery_date) {
      return NextResponse.json({ error: "Delivery details and expected delivery date are required." }, { status: 400 })
    }

    const updateData: any = {
      status: "completed",
      delivery_details,
      expected_delivery_date,
      completed_at: new Date().toISOString(),
    }

    const { data, error } = await supabase.from("submissions").update(updateData).eq("id", id).select().single()

    if (error) {
      console.error("Error updating submission:", error)
      throw new Error(error.message || "Supabase error during submission update.")
    }

    return NextResponse.json(data)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to update submission"
    console.error("API Error in /api/admin/submissions/[id]:", errorMessage)
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
