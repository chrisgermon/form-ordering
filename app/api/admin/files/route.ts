import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"
import { NextResponse } from "next/server"
import { del, list } from "@vercel/blob"

export async function GET(request: Request) {
  const supabase = createClient()
  const { searchParams } = new URL(request.url)
  const brandId = searchParams.get("brandId")

  if (brandId) {
    try {
      const { data, error } = await supabase
        .from("files")
        .select("*")
        .eq("brand_id", brandId)
        .order("uploaded_at", { ascending: false })

      if (error) {
        console.error("Error fetching files:", error)
        throw new Error(error.message)
      }

      return NextResponse.json(data)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
      return NextResponse.json({ error: `Failed to fetch files: ${errorMessage}` }, { status: 500 })
    }
  } else {
    try {
      const { blobs } = await list()
      const files = blobs.map((blob) => ({ name: blob.pathname, url: blob.url }))
      return NextResponse.json(files)
    } catch (error) {
      return NextResponse.json({ error: "Failed to list files" }, { status: 500 })
    }
  }
}

export async function DELETE(request: Request) {
  const supabase = createClient()
  const { fileIds } = await request.json()

  if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
    return NextResponse.json({ error: "File IDs are required" }, { status: 400 })
  }

  try {
    // First, get the pathnames to delete from Vercel Blob
    const { data: filesToDelete, error: selectError } = await supabase.from("files").select("url").in("id", fileIds)

    if (selectError) {
      throw new Error(selectError.message)
    }

    const blobUrls = filesToDelete.map((file) => file.url).filter(Boolean) as string[]
    if (blobUrls.length > 0) {
      await del(blobUrls)
    }

    // Then, delete the records from the database
    const { error: deleteError } = await supabase.from("files").delete().in("id", fileIds)

    if (deleteError) {
      throw new Error(deleteError.message)
    }

    revalidatePath("/admin/editor/[brandSlug]", "page")
    return NextResponse.json({ message: "Files deleted successfully" })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json({ error: `Failed to delete files: ${errorMessage}` }, { status: 500 })
  }
}
