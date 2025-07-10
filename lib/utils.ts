import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Resolves an asset path to a full URL.
 * If the path is already a full URL, it returns it.
 * If it's a pathname (doesn't start with http), it prepends the proxy path.
 * @param pathOrUrl - The path or full URL of the asset.
 * @returns A full URL suitable for use in src attributes.
 */
export function resolveAssetUrl(pathOrUrl: string | null | undefined): string {
  if (!pathOrUrl) {
    // Return a placeholder if no path is provided
    return `/placeholder.svg?height=40&width=100&query=asset`
  }
  // Check if it's already a full URL
  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
    // If it's a blob storage URL, we prefer to proxy it.
    if (pathOrUrl.includes(".blob.vercel-storage.com/")) {
      try {
        const url = new URL(pathOrUrl)
        return `/files${url.pathname}`
      } catch (e) {
        // Fallback for invalid URLs
        return pathOrUrl
      }
    }
    return pathOrUrl
  }
  // Otherwise, assume it's a pathname and construct the proxied URL
  return `/files/${pathOrUrl}`
}
