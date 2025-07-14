import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createServerSupabaseClient()
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
      // completed_by: 'Admin' // Placeholder until user auth is added
    }

    const { data, error } = await supabase.from("submissions").update(updateData).eq("id", id).select().single()

    if (error) {
      console.error("Error updating submission:", error)
      // The error object from Supabase contains the specific message
      throw error
    }

    return NextResponse.json(data)
  } catch (error) {
    // Log the full error for better debugging
    console.error("Full error in PUT /api/admin/submissions/[id]:", error)
    const errorMessage =
      error && typeof error === "object" && "message" in error
        ? (error as { message: string }).message
        : "An unknown error occurred"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
