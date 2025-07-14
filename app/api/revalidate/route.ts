import { type NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"

// This route is called to manually revalidate the cache for a specific path.
export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const path = searchParams.get("path")

  if (!path) {
    return NextResponse.json({ error: "Path parameter is required" }, { status: 400 })
  }

  try {
    revalidatePath(path)
    return NextResponse.json({ revalidated: true, now: Date.now() })
  } catch (error) {
    console.error("Error revalidating path:", error)
    return NextResponse.json({ error: "Invalidation failed" }, { status: 500 })
  }
}
