import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient()
    const body = await request.json()
    const { id } = params
    const { delivery_details, expected_delivery_date } = body
    if (!id) {
      return NextResponse.json({ error: "Submission ID is required" }, { status: 400 })
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
      throw error
    }
    return NextResponse.json(data)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to update submission"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
