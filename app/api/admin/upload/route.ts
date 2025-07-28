import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/utils/supabase/server"
import { put } from "@vercel/blob"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ["application/pdf", "image/png", "image/jpeg", "image/svg+xml"]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Only PDF, PNG, JPG, and SVG files are allowed" }, { status: 400 })
    }

    // Upload to Vercel Blob
    const filename = `admin-uploads/${Date.now()}-${file.name}`
    const blob = await put(filename, file, {
      access: "public",
      contentType: file.type,
    })

    // Save file info to database
    const supabase = createAdminClient()
    const { data: uploadedFile, error } = await supabase
      .from("uploaded_files")
      .insert({
        filename: filename,
        original_name: file.name,
        url: blob.url,
        pathname: blob.pathname, // Store the pathname
        size: file.size,
        content_type: file.type,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(uploadedFile)
  } catch (error) {
    console.error("Error uploading file:", error)
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 })
  }
}
