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
      throw error
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Full error in PUT /api/admin/submissions/[id]:", error)

    let errorMessage = "An unknown error occurred while updating the submission."
    let statusCode = 500

    if (error && typeof error === "object" && "code" in error && "message" in error) {
      const supabaseError = error as { code: string; message: string }
      errorMessage = supabaseError.message

      // Check for the specific schema cache error and provide a helpful message
      if (supabaseError.code === "PGRST204" && supabaseError.message.includes("in the schema cache")) {
        errorMessage = `Database schema mismatch: ${supabaseError.message}. The API cache is stale. Please restart your project in the Supabase dashboard (Settings > General > Restart project) to force a refresh.`
        statusCode = 409 // Conflict
      }
    }

    return NextResponse.json({ error: errorMessage }, { status: statusCode })
  }
}
