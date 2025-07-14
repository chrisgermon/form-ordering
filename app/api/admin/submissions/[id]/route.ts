import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"
import { sendOrderCompletionEmail } from "@/lib/email"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient()
  try {
    const { delivery_details, expected_delivery_date } = await request.json()

    if (!params.id) {
      return NextResponse.json({ error: "Submission ID is required" }, { status: 400 })
    }

    const { data: updatedSubmission, error } = await supabase
      .from("submissions")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        delivery_details,
        expected_delivery_date,
      })
      .eq("id", params.id)
      .select(
        `
        *,
        brand:brands (name)
      `,
      )
      .single()

    if (error) {
      console.error("Error updating submission:", error)
      // Check for a specific error if PostgREST schema cache is stale
      if (error.message.includes("column") && error.message.includes("does not exist")) {
        return NextResponse.json(
          {
            error: "Database schema might be out of date. Please try reloading the schema in the admin dashboard.",
            details: error.message,
          },
          { status: 500 },
        )
      }
      throw error
    }

    if (updatedSubmission) {
      // Manually map brand name for consistency and prepare for email
      const submissionForEmail = {
        ...updatedSubmission,
        brand_name: updatedSubmission.brand?.name || "Unknown Brand",
      }
      // Fire and forget the email to the user who placed the order
      sendOrderCompletionEmail(submissionForEmail).catch((e) =>
        console.error(`Failed to send completion email for submission ${updatedSubmission.id}:`, e),
      )
    }

    return NextResponse.json(updatedSubmission)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    console.error("PUT /api/admin/submissions/[id] Error:", errorMessage)
    return NextResponse.json({ error: "Failed to update submission", details: errorMessage }, { status: 500 })
  }
}
