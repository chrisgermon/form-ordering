import { handleUpload, type HandleUploadBody } from "@vercel/blob/client"
import { NextResponse } from "next/server"
import { createAdminClient } from "@/utils/supabase/server"

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody
  const supabase = createAdminClient()

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname: string, clientPayload?: string) => {
        const payload = clientPayload ? JSON.parse(clientPayload) : {}
        const { brandId } = payload

        if (!brandId) {
          throw new Error("Brand ID is required for upload.")
        }

        return {
          allowedContentTypes: ["image/jpeg", "image/png", "image/gif", "application/pdf"],
          tokenPayload: JSON.stringify({
            pathname,
            brandId,
          }),
        }
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        const { brandId } = JSON.parse(tokenPayload)

        const { error } = await supabase.from("files").insert({
          pathname: blob.pathname,
          url: blob.url,
          content_type: blob.contentType,
          brand_id: brandId,
        })

        if (error) {
          console.error("Error inserting file into Supabase:", error)
          throw new Error("Failed to save file metadata.")
        }
      },
    })

    return NextResponse.json(jsonResponse)
  } catch (error) {
    const message = error instanceof Error ? error.message : "An unknown error occurred."
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
