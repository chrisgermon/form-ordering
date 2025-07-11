import * as cheerio from "cheerio"
import { put } from "@vercel/blob"
import { nanoid } from "nanoid"
import path from "path"

export async function scrapeWebsiteForData(url: string) {
  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.statusText}`)
    }
    const html = await response.text()
    const $ = cheerio.load(html)
    const baseUrl = new URL(url).origin

    const title = $("title").first().text() || $('meta[property="og:title"]').attr("content") || ""

    let logoUrl: string | undefined
    const logoSelectors = [
      'meta[property="og:logo"]',
      'meta[property="og:image"]',
      'link[rel="apple-touch-icon"]',
      'link[rel="shortcut icon"]',
      'link[rel="icon"]',
      'img[src*="logo"]',
      'img[class*="logo"]',
      "header img",
    ]

    for (const selector of logoSelectors) {
      const potentialLogoSrc = $(selector).attr("content") || $(selector).attr("src") || $(selector).attr("href")
      if (potentialLogoSrc) {
        try {
          logoUrl = new URL(potentialLogoSrc, baseUrl).href
          break
        } catch (e) {
          console.warn(`Invalid logo URL found: ${potentialLogoSrc}`)
        }
      }
    }

    // A simple heuristic to find locations - this is very basic
    const locations: string[] = []
    $('p:contains("Location"), p:contains("Address"), div:contains("Location"), div:contains("Address")').each(
      (i, elem) => {
        const text = $(elem).text().replace(/\s\s+/g, " ").trim()
        if (text.length > 10 && text.length < 200) {
          locations.push(text)
        }
      },
    )

    return {
      title,
      logoUrl,
      locations: [...new Set(locations)], // Return unique locations
    }
  } catch (error) {
    console.error("Error scraping website:", error)
    const message = error instanceof Error ? error.message : "An unknown error occurred during scraping."
    throw new Error(message)
  }
}

export async function fetchAndUploadLogo(
  url: string,
  brandSlug: string,
): Promise<{ blobUrl: string; pathname: string } | null> {
  try {
    const { logoUrl } = await scrapeWebsiteForData(url)
    if (!logoUrl) {
      return null
    }

    const response = await fetch(logoUrl)
    if (!response.ok) {
      console.error(`Failed to fetch logo image from ${logoUrl}: ${response.statusText}`)
      return null
    }
    const imageBlob = await response.blob()
    const originalName = path.basename(new URL(logoUrl).pathname) || `logo-${nanoid(5)}`
    const filename = `logos/${brandSlug}-${Date.now()}-${originalName}`

    const { url: blobUrl, pathname } = await put(filename, imageBlob, {
      access: "public",
      contentType: response.headers.get("content-type") || undefined,
    })

    return { blobUrl, pathname }
  } catch (error) {
    console.error("Error fetching and uploading logo:", error)
    return null
  }
}
