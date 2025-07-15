import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^\w-]+/g, "") // Remove all non-word chars
    .replace(/--+/g, "-") // Replace multiple - with single -
}

export function resolveAssetUrl(path: string | null | undefined): string {
  if (!path) {
    return "/abstract-logo.png"
  }
  if (path.startsWith("http")) {
    return path
  }
  // For Supabase storage URLs that might be stored as relative paths
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (supabaseUrl && !path.includes(supabaseUrl)) {
    return `${supabaseUrl}/storage/v1/object/public/${path}`
  }
  return path
}

export function getPublicUrl(filePath: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl) {
    console.error("Supabase URL is not configured.")
    return ""
  }
  // Ensure we don't double-up the storage path if it's already there
  if (filePath.includes("/storage/v1/object/public")) {
    return `${supabaseUrl}${filePath}`
  }
  return `${supabaseUrl}/storage/v1/object/public/${filePath}`
}
