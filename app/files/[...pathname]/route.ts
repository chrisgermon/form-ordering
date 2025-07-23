import { NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

export async function GET(request: Request, { params }: { params: { pathname: string[] } }) {
  const supabase = createClient()
  const filePath = params.pathname.join("/")

  const { data, error } = await supabase.storage.from("files").download(filePath)

  if (error) {
    return NextResponse.json({ error: "File not found" }, { status: 404 })
  }

  return new NextResponse(data, {
    headers: {
      "Content-Type": data.type,
    },
  })
}
