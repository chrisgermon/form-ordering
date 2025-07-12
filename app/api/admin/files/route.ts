import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/utils/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const { searchParams } = new URL(request.url)
    const brandId = searchParams.get("brandId")

    let query = supabase.from("uploaded_files").select("*, brands(name)").order("uploaded_at", { ascending: false })

    if (brandId && brandId !== "global") {
      query = query.eq("brand_id", brandId)
    }

    const { data: files, error } = await query

    if (error) throw error

    return NextResponse.json(files)
  } catch (error) {
    console.error("Error fetching files:", error)
    return NextResponse.json({ error: "Failed to fetch files" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "File ID is required" }, { status: 400 })
    }

    // TODO: Also delete from Vercel Blob storage

    const { error } = await supabase.from("uploaded_files").delete().eq("id", id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting file:", error)
    return NextResponse.json({ error: "Failed to delete file" }, { status: 500 })
  }
}
