import { put } from "@vercel/blob"
import * as cheerio from "cheerio"
import { nanoid } from "nanoid"
import path from "path"

async function fetchHtml(url: string) {
  try {
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
    const originalName = path.basename(new URL(logoUrl).pathname) || `logo-${nanoid(5)}`
    const filename = `logos/${brandSlug}-${Date.now()}-${originalName}`

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
): Promise<{ title: string; description: string; locations: string[]; logoUrl: string | null }> {
  const html = await fetchHtml(url)
  if (!html) {
    return { title: "", description: "", locations: [], logoUrl: null }
  }

  const $ = cheerio.load(html)
  const baseUrl = new URL(url).origin

  const title = $("title").first().text() || ""
  const description = $('meta[name="description"]').attr("content") || ""

  // Find Logo URL
  const logoSelectors = [
    'meta[property="og:logo"]',
    'meta[property="og:image"]',
    'link[rel="apple-touch-icon"]',
    'link[rel="shortcut icon"]',
    'link[rel="icon"]',
  ]
  let logoUrl: string | null = null
  for (const selector of logoSelectors) {
    const potentialLogoSrc = $(selector).attr("content") || $(selector).attr("href")
    if (potentialLogoSrc) {
      logoUrl = new URL(potentialLogoSrc, baseUrl).href
      break
    }
  }
  if (!logoUrl) {
    const imgSelector = 'img[src*="logo"], img[alt*="logo" i]'
    const logoSrc = $(imgSelector).first().attr("src")
    if (logoSrc) {
      logoUrl = new URL(logoSrc, baseUrl).href
    }
  }

  // Find Locations
  const locations: string[] = []
  $("body")
    .find(":contains('Address'), :contains('Location')")
    .each((i, elem) => {
      const parentText = $(elem).parent().text().replace(/\s\s+/g, " ").trim()
      if (parentText.length > 20 && parentText.length < 200) {
        locations.push(parentText)
      }
    })

  return { title, description, locations: [...new Set(locations)].slice(0, 5), logoUrl }
}

export async function fetchAndUploadLogo(url: string, brandSlug: string): Promise<string | null> {
  const html = await fetchHtml(url)
  if (!html) {
    return null
  }

  try {
    const $ = cheerio.load(html)
    const baseUrl = new URL(url).origin

    const logoSelectors = [
      'meta[property="og:logo"]',
      'meta[property="og:image"]',
      'link[rel="apple-touch-icon"]',
      'link[rel="shortcut icon"]',
      'link[rel="icon"]',
    ]
    let logoUrl: string | undefined

    for (const selector of logoSelectors) {
      const potentialLogoSrc = $(selector).attr("content") || $(selector).attr("href")
      if (potentialLogoSrc) {
        logoUrl = new URL(potentialLogoSrc, baseUrl).href
        break
      }
    }

    if (!logoUrl) {
      const imgSelector = 'img[src*="logo"], img[alt*="logo" i]'
      const logoSrc = $(imgSelector).first().attr("src")
      if (logoSrc) {
        logoUrl = new URL(logoSrc, baseUrl).href
      }
    }

    if (!logoUrl) {
      console.log("Could not find a logo URL on the page.")
      return null
    }

    return await uploadLogo(logoUrl, brandSlug)
  } catch (error) {
    console.error("Error fetching or uploading logo:", error)
    return null
  }
}
