import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function slugify(text: string): string {
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
 * A robust function to construct a full public URL for a Supabase Storage asset.
 * @param path The path to the file in the bucket (e.g., "bucket-name/file.png").
 * @param fallback The value to return if the path is invalid or Supabase URL is not configured.
 * @returns A full URL to the asset or the fallback value.
 */
function constructSupabaseUrl(path: string | null | undefined, fallback: string): string {
  if (!path) {
    return fallback
  }
  if (path.startsWith("http")) {
    return path
  }
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl) {
    console.error("Supabase URL is not configured in environment variables.")
    return fallback
  }
  const cleanedPath = path.startsWith("/") ? path.substring(1) : path
  return `${supabaseUrl}/storage/v1/object/public/${cleanedPath}`
}

/**
 * Used for client-side display of assets. Provides a placeholder image path on failure.
 * @param path The path to the file in the bucket.
 * @returns A full URL to the asset or a placeholder image path.
 */
export function resolveAssetUrl(path: string | null | undefined): string {
  return constructSupabaseUrl(path, "/placeholder-logo.png")
}

/**
 * Used for server-side logic (like PDF generation). Returns an empty string on failure.
 * @param path The path to the file in the bucket.
 * @returns A full URL to the asset or an empty string.
 */
export function getPublicUrl(path: string | null | undefined): string {
  return constructSupabaseUrl(path, "")
}
