import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function resolveAssetUrl(path: string | null | undefined): string {
  if (!path) {
    // Return a path to a default placeholder image
    return `/placeholder.svg?width=100&height=40&query=logo`
  }
  // If it's already a full URL (from Vercel Blob), return it directly.
  if (path.startsWith("http")) {
    return path
  }
  // This is a fallback for any unexpected format.
  return `/placeholder.svg?width=100&height=40&query=invalid-path`
}
