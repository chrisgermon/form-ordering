import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/utils/supabase/server"
import { del } from "@vercel/blob"
import { revalidatePath } from "next/cache"

export const revalidate = 0

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
  const supabase = createAdminClient()
  try {
    const body = await request.json().catch(() => null)
    const singleFileId = new URL(request.url).searchParams.get("id")

    const fileIdsToDelete = body?.fileIds || (singleFileId ? [singleFileId] : [])

    if (fileIdsToDelete.length === 0) {
      return NextResponse.json({ error: "File ID(s) are required" }, { status: 400 })
    }

    // Step 1: Fetch file details (URLs) from the database
    const { data: filesToDelete, error: fetchError } = await supabase
      .from("uploaded_files")
      .select("url")
      .in("id", fileIdsToDelete)

    if (fetchError) {
      console.error("Error fetching files for deletion:", fetchError)
      throw new Error(`Database error fetching files: ${fetchError.message}`)
    }

    // Step 2: Delete files from Vercel Blob storage
    if (filesToDelete && filesToDelete.length > 0) {
      const urlsToDelete = filesToDelete.map((file) => file.url).filter(Boolean)
      if (urlsToDelete.length > 0) {
        try {
          await del(urlsToDelete)
        } catch (blobError) {
          // Log blob deletion error but continue to attempt DB deletion
          console.error("Error deleting files from Vercel Blob:", blobError)
        }
      }
    }

    // Step 3: Delete file records from the database
    const { error: deleteError } = await supabase.from("uploaded_files").delete().in("id", fileIdsToDelete)

    if (deleteError) {
      console.error("Error deleting file records from DB:", deleteError)
      throw new Error(`Database error deleting records: ${deleteError.message}`)
    }

    // Step 4: Revalidate paths to clear caches
    revalidatePath("/admin")
    revalidatePath("/api/admin/files")

    return NextResponse.json({ success: true, message: `${fileIdsToDelete.length} files deleted successfully.` })
  } catch (error) {
    console.error("Error in DELETE /api/admin/files:", error)
    const errorMessage = error instanceof Error ? error.message : "An unknown server error occurred"
    return NextResponse.json({ error: `Failed to delete file(s).`, details: errorMessage }, { status: 500 })
  }
}
