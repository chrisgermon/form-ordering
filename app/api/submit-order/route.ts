import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { sendOrderEmail } from "@/lib/email"
import type { Submission } from "@/lib/types"

export async function POST(request: Request) {
  const supabase = createClient()
  const submissionData = await request.json()

  try {
    const { data, error } = await supabase.from("submissions").insert([submissionData]).select().single()

    if (error) {
      console.error("Error inserting submission:", error)
      return NextResponse.json({ error: "Failed to save submission." }, { status: 500 })
    }

    if (data) {
      await sendOrderEmail(data as Submission)
    }

    return NextResponse.json({ success: true, submissionId: data?.id })
  } catch (e) {
    const error = e as Error
    console.error("Error in submit-order route:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
