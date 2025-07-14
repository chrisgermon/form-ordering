import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Generates a URL-friendly slug from a string.
 * e.g., "Patient Name" -> "patient-name"
 */
export const slugify = (text: string): string => {
  if (!text) return ""
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^\w-]+/g, "") // Remove all non-word chars
    .replace(/--+/g, "-") // Replace multiple - with single -
}

/**
 * Constructs a full, public URL for a Supabase Storage asset.
 * @param path The path to the file in the bucket (e.g., "bucket-name/file.png").
 * @returns A full URL to the asset or a placeholder if the path is invalid.
 */
export function resolveAssetUrl(path: string | null | undefined): string {
  if (!path) {
    return "/placeholder-logo.png"
  }

  // If it's already a full URL, return it directly.
  if (path.startsWith("http")) {
    return path
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl) {
    console.error("Supabase URL is not configured in environment variables.")
    return "/placeholder-logo.png"
  }

  // Trim leading slashes to prevent URL malformation (e.g. ...//bucket/file)
  const cleanedPath = path.startsWith("/") ? path.substring(1) : path

  return `${supabaseUrl}/storage/v1/object/public/${cleanedPath}`
}
