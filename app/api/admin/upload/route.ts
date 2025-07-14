import { put } from "@vercel/blob"
import { NextResponse } from "next/server"
import { createAdminClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"

export async function POST(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url)
  const filename = searchParams.get("filename")
  const brandId = searchParams.get("brandId")

  if (!filename || !request.body) {
    return NextResponse.json({ error: "Filename and body are required" }, { status: 400 })
  }

  if (!brandId) {
    return NextResponse.json({ error: "Brand ID is required" }, { status: 400 })
  }

  const blob = await put(filename, request.body, {
    access: "public",
  })

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("files")
    .insert({
      pathname: blob.pathname,
      url: blob.url,
      original_name: filename,
      brand_id: brandId,
    })
    .select()
    .single()

  if (error) {
    console.error("Error inserting file into Supabase:", error)
    return NextResponse.json({ error: "Failed to save file metadata" }, { status: 500 })
  }

  revalidatePath(`/admin/editor/${brandId}`)

  return NextResponse.json(data)
}
