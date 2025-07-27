import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = createClient()
    const { data: submissions, error } = await supabase
      .from("submissions")
      .select(`*, brands (name)`)
      .order("created_at", { ascending: false })
    if (error) throw error
    const formattedSubmissions = submissions.map((s: any) => ({
      ...s,
      brand_name: s.brands?.name || "Unknown Brand",
      brands: undefined,
    }))
    return NextResponse.json(formattedSubmissions)
  } catch (error) {
    console.error("Error fetching submissions:", error)
    return NextResponse.json({ error: "Failed to fetch submissions" }, { status: 500 })
  }
}
