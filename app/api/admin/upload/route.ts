import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { put } from "@vercel/blob"

export async function POST(request: NextRequest) {
  const supabase = createAdminClient()
  const formData = await request.formData()
  const file = formData.get("file") as File
  const brandId = formData.get("brandId") as string | null // Can be null for global files

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 })
  }

  try {
    const blob = await put(file.name, file, {
      access: "public",
    })

    const { data, error } = await supabase
      .from("files")
      .insert({
        pathname: blob.pathname,
        url: blob.url,
        content_type: blob.contentType,
        size: blob.size,
        brand_id: brandId, // Insert brand_id
      })
      .select()
      .single()

    if (error) {
      console.error("Error inserting file record:", error)
      return NextResponse.json({ error: "Failed to save file record" }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: error.message || "Failed to upload file" }, { status: 500 })
  }
}
