import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse, type NextRequest } from "next/server"

export const revalidate = 0

// GET all allowed IPs
export async function GET() {
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase.from("allowed_ips").select("*").order("created_at", { ascending: false })

    if (error) throw error
    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST a new allowed IP
export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const { ip_address, description } = await request.json()

    if (!ip_address) {
      return NextResponse.json({ error: "IP address is required" }, { status: 400 })
    }

    const { data, error } = await supabase.from("allowed_ips").insert({ ip_address, description }).select().single()

    if (error) {
      if (error.code === "23505") {
        // unique constraint violation
        return NextResponse.json({ error: "This IP address is already on the list." }, { status: 409 })
      }
      throw error
    }
    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE an allowed IP
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const { id } = await request.json()

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 })
    }

    const { error } = await supabase.from("allowed_ips").delete().eq("id", id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
