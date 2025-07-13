import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { revalidatePath } from "next/cache"
import type { SupabaseClient } from "@supabase/supabase-js"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function resolveAssetUrl(pathOrUrl: string | null | undefined): string {
  if (!pathOrUrl) {
    return `/placeholder.svg?height=40&width=100&query=asset`
  }
  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
    return pathOrUrl
  }
  return `/files/${pathOrUrl}`
}

export function getBrandInitials(name: string) {
  if (!name) return ""
  const words = name.split(" ")
  if (words.length > 1) {
    return words
      .map((word) => word[0])
      .join("")
      .toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
}

export async function autoAssignPdfs(supabase: SupabaseClient) {
  try {
    const { data: files, error: filesError } = await supabase.from("uploaded_files").select("original_name, url")
    if (filesError) throw filesError

    const { data: items, error: itemsError } = await supabase
      .from("product_items")
      .select("id, code")
      .is("sample_link", null)
    if (itemsError) throw itemsError

    if (!files || !items) {
      return { success: true, message: "No files or items to process." }
    }

    let assignments = 0
    for (const item of items) {
      const matchingFile = files.find((file) => file.original_name.toUpperCase().startsWith(item.code.toUpperCase()))
      if (matchingFile) {
        await supabase.from("product_items").update({ sample_link: matchingFile.url }).eq("id", item.id)
        assignments++
      }
    }
    revalidatePath("/admin")
    return { success: true, message: `Auto-assigned ${assignments} PDF links.` }
  } catch (error: any) {
    console.error("Failed to auto-assign PDFs:", error)
    return { success: false, message: `Failed to auto-assign PDFs: ${error.message}` }
  }
}
