import { NextResponse } from "next/server"
import { createAdminClient } from "@/utils/supabase/server"
import { del } from "@vercel/blob"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const brandId = searchParams.get("brandId")
  const supabase = createAdminClient()

  if (!brandId) {
    return NextResponse.json({ error: "Brand ID is required" }, { status: 400 })
  }

  try {
    const { data, error } = await supabase
      .from("files")
      .select("*")
      .eq("brand_id", brandId)
      .order("created_at", { ascending: false })

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    const message = error instanceof Error ? error.message : "An unknown error occurred."
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const { url } = await request.json()
  const supabase = createAdminClient()

  if (!url) {
    return NextResponse.json({ error: "File URL is required" }, { status: 400 })
  }

  try {
    // Delete from Vercel Blob storage
    await del(url)

    // Delete from Supabase 'files' table
    const { error } = await supabase.from("files").delete().eq("url", url)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : "An unknown error occurred."
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
