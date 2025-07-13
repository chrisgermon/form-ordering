import { handleUpload, type HandleUploadBody } from "@vercel/blob/client"
import { NextResponse } from "next/server"
import { createAdminClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody
  const { searchParams } = new URL(request.url)
  const brandId = searchParams.get("brandId")

  if (!brandId) {
    return NextResponse.json({ error: "Brand ID is required for upload." }, { status: 400 })
  }

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        return {
          allowedContentTypes: ["image/jpeg", "image/png", "image/gif", "image/svg+xml", "application/pdf"],
          tokenPayload: JSON.stringify({
            brandId: brandId,
            pathname: pathname,
          }),
        }
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        const { brandId, pathname } = JSON.parse(tokenPayload)
        const supabase = createAdminClient()
        const { error } = await supabase.from("files").insert({
          brand_id: brandId,
          pathname: pathname,
          url: blob.url,
          original_name: blob.pathname,
          uploaded_at: new Date().toISOString(),
        })

        if (error) {
          console.error("Error saving file metadata to Supabase:", error)
          throw new Error("Could not save file metadata.")
        }

        revalidatePath(`/admin/editor/${brandId}`) // Revalidate by ID if slug not available
      },
    })

    return NextResponse.json(jsonResponse)
  } catch (error) {
    const message = error instanceof Error ? error.message : "An unknown error occurred."
    return NextResponse.json({ error: `Upload failed: ${message}` }, { status: 400 })
  }
}
