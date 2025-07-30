import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { slugify } from "@/lib/utils"

export async function PUT(request: Request, { params }: { params: { slug: string } }) {
  const supabase = createClient()
  const { name, logo_url, clinics } = await request.json()

  const updateData: { name?: string; slug?: string; logo_url?: string; clinics?: any } = {}
  if (name) {
    updateData.name = name
    updateData.slug = slugify(name)
  }
  if (logo_url !== undefined) updateData.logo_url = logo_url
  if (clinics !== undefined) updateData.clinics = clinics

  const { data, error } = await supabase.from("brands").update(updateData).eq("slug", params.slug).select().single()

  if (error) {
    console.error(`Error updating brand ${params.slug}:`, error)
    return NextResponse.json({ error: "Failed to update brand." }, { status: 500 })
  }

  return NextResponse.json(data)
}
