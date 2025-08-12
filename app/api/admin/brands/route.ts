import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { slugify } from "@/lib/utils"

export async function POST(request: Request) {
  const supabase = createClient()
  const { name, logo_url } = await request.json()

  if (!name) {
    return NextResponse.json({ error: "Brand name is required." }, { status: 400 })
  }

  const slug = slugify(name)

  const { data, error } = await supabase.from("brands").insert([{ name, slug, logo_url }]).select().single()

  if (error) {
    console.error("Error creating brand:", error)
    return NextResponse.json({ error: "Failed to create brand." }, { status: 500 })
  }

  return NextResponse.json(data)
}
