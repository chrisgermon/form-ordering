import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET() {
  try {
    const supabase = createAdminClient()

    // Explicitly select columns to avoid errors if the schema is out of sync.
    // The error "column uploaded_files.created_at does not exist" indicates
    // that a query was trying to access a column that is not in the table.
    const { data: files, error } = await supabase
      .from("uploaded_files")
      .select("id, pathname, original_name, url, uploaded_at, size, content_type")
      .order("uploaded_at", { ascending: false })

    if (error) {
      // Re-throw the error to be caught by the catch block
      throw error
    }

    return NextResponse.json(files)
  } catch (error: any) {
    console.error("Error fetching files:", error)
    // Return the actual database error message for better debugging
    return NextResponse.json({ error: `Failed to fetch files: ${error.message}` }, { status: 500 })
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

    const { error } = await supabase.from("uploaded_files").delete().eq("id", id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error deleting file:", error)
    return NextResponse.json({ error: `Failed to delete file: ${error.message}` }, { status: 500 })
  }
}
