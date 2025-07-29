import { list } from "@vercel/blob"
import { NextResponse } from "next/server"

// This ensures the route is not cached and always fetches the latest file.
export const dynamic = "force-dynamic"

export async function GET(request: Request, { params }: { params: { pathname: string[] } }) {
  const pathname = params.pathname.join("/")

  // Find the blob in the store by its pathname
  const { blobs } = await list({ prefix: pathname, limit: 1 })

  // If no blob is found or the pathname doesn't match exactly, return 404
  if (blobs.length === 0 || blobs[0].pathname !== pathname) {
    return new NextResponse("File not found", { status: 404 })
  }

  const blob = blobs[0]

  // Fetch the actual file from the blob store URL
  const blobResponse = await fetch(blob.url)

  // If the fetch from blob storage fails, pass through the error
  if (!blobResponse.ok) {
    return new NextResponse(blobResponse.body, {
      status: blobResponse.status,
      statusText: blobResponse.statusText,
    })
  }

  // Stream the response back to the client with correct headers
  const headers = new Headers()
  let contentType = blob.contentType || "application/octet-stream"

  // Ensure SVGs are served with the correct content type, even if blob storage metadata is wrong.
  if (blob.pathname.toLowerCase().endsWith(".svg")) {
    contentType = "image/svg+xml"
  }

  headers.set("Content-Type", contentType)
  headers.set("Content-Length", blob.size.toString())
  headers.set("Content-Disposition", `inline; filename="${blob.pathname.split("/").pop()}"`)

  return new NextResponse(blobResponse.body, {
    status: 200,
    headers,
  })
}
