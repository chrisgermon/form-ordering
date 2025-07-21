import { createServerClient } from "@/utils/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from("submissions")
    .select("*, brand:brands(*), submission_items(*, item:items(*))")
    .order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
