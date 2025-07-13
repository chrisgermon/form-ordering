import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Resolves an asset path to a full, usable URL.
 * @param path - The path or full URL from the database.
 * @returns A full URL for the asset or a placeholder if the path is invalid.
 */
export function resolveAssetUrl(path: string | null | undefined): string {
  if (!path) {
    return `/placeholder.svg?width=100&height=40&query=logo`
  }
  // Correctly handles valid, full URLs from Vercel Blob storage.
  if (path.startsWith("http")) {
    return path
  }
  // Gracefully handles old, incorrect relative paths by showing a placeholder
  // and logging a warning to the browser console to aid debugging.
  console.warn(`Invalid asset path detected: "${path}". Displaying a placeholder. To fix, please re-upload the asset.`)
  return `/placeholder.svg?width=100&height=40&query=invalid-path`
}
