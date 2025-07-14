import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function resolveAssetUrl(path: string | null | undefined): string {
  if (!path) {
    // Return a placeholder if the path is null or empty
    return "/placeholder-logo.png"
  }

  // If it's already a full URL, return it as is.
  if (path.startsWith("http")) {
    return path
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl) {
    console.error("Supabase URL is not configured in environment variables.")
    return "/placeholder-logo.png"
  }

  // Correctly construct the public URL for Supabase Storage objects.
  // The path in the database should be `bucket_name/file_path_within_bucket`.
  // Example: `admin-uploads/image.png`
  return `${supabaseUrl}/storage/v1/object/public/${path}`
}
