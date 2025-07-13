import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function resolveAssetUrl(path: string | null | undefined): string {
  if (!path) {
    // Return a path to a default placeholder image in the public folder
    return "/favicon.png"
  }
  // If it's already a full URL (from Vercel Blob), return it directly.
  if (path.startsWith("http")) {
    return path
  }
  // Otherwise, assume it's a local public asset.
  return path
}
