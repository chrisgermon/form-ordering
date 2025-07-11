import { put } from "@vercel/blob"
import * as cheerio from "cheerio"
import metascraper from "metascraper"
import metascraperImage from "metascraper-image"

const scraper = metascraper([metascraperImage()])

async function fetchHtml(url: string) {
  try {
    // Use a common user-agent to avoid being blocked
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    })
    if (!response.ok) {
      console.error(`Failed to fetch ${url}: ${response.statusText}`)
      return null
    }
    return await response.text()
  } catch (error) {
    console.error(`Error fetching ${url}:`, error)
    return null
  }
}

async function uploadLogo(logoUrl: string, brandSlug: string): Promise<string | null> {
  try {
    const response = await fetch(logoUrl)
    if (!response.ok) {
      console.error(`Failed to fetch logo image: ${response.statusText}`)
      return null
    }
    const imageBlob = await response.blob()
    const fileExtension = new URL(logoUrl).pathname.split(".").pop()?.split("?")[0] || "png"
    const filename = `logos/${brandSlug}-logo.${fileExtension}`

    const { url: blobUrl } = await put(filename, imageBlob, {
      access: "public",
      contentType: response.headers.get("content-type") || undefined,
    })

    return blobUrl
  } catch (error) {
    console.error("Error uploading logo:", error)
    return null
  }
}

export async function scrapeWebsiteForData(
  url: string,
): Promise<{ title: string; description: string; locations: string[] }> {
  const html = await fetchHtml(url)
  if (!html) {
    return { title: "", description: "", locations: [] }
  }

  const $ = cheerio.load(html)
  const title = $("title").first().text() || ""
  const description = $('meta[name="description"]').attr("content") || ""

  // This is a basic attempt to find locations and is highly site-specific.
  const locations: string[] = []
  $("body")
    .find(":contains('Address'), :contains('Location')")
    .each((i, elem) => {
      const parentText = $(elem).parent().text().replace(/\s\s+/g, " ").trim()
      // Heuristic for address-like text
      if (parentText.length > 20 && parentText.length < 200) {
        locations.push(parentText)
      }
    })

  // Return unique locations, max 5
  return { title, description, locations: [...new Set(locations)].slice(0, 5) }
}

export async function fetchAndUploadLogo(url: string, brandSlug: string): Promise<string | null> {
  const html = await fetchHtml(url)
  if (!html) {
    return null
  }

  try {
    const metadata = await scraper({ url, html })
    let logoUrl = metadata.image

    if (!logoUrl) {
      // Fallback: try to find a logo via cheerio
      const $ = cheerio.load(html)
      const logoSrc =
        $('img[src*="logo"]').first().attr("src") ||
        $('img[alt*="logo" i]').first().attr("src") ||
        $('link[rel="shortcut icon"]').first().attr("href") ||
        $('link[rel="icon"]').first().attr("href")

      if (logoSrc) {
        logoUrl = new URL(logoSrc, url).href
      } else {
        return null
      }
    }

    return await uploadLogo(logoUrl, brandSlug)
  } catch (error) {
    console.error("Error fetching or uploading logo:", error)
    return null
  }
}
