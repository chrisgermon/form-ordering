"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { sendOrderCompletionEmail } from "@/lib/email"
import { exec } from "child_process"
import { promisify } from "util"
import { put } from "@vercel/blob"
import fs from "fs/promises"
import path from "path"

const execAsync = promisify(exec)

export async function scrapeClinicsFromWebsite(brandId: number, url: string) {
  if (!url) {
    return { success: false, error: "URL is required." }
  }

  try {
    const response = await fetch(url)
    if (!response.ok) {
      return { success: false, error: `Failed to fetch URL: ${response.statusText}` }
    }
    const html = await response.text()

    // This is a very basic scraper and might need to be adjusted for specific site structures.
    // It looks for list items within a 'locations' or 'clinics' class/id, or just all `<li>` as a fallback.
    const cheerio = await import("cheerio")
    const $ = cheerio.load(html)

    let clinics: string[] = []
    const potentialSelectors = [
      ".locations li",
      "#locations li",
      ".clinics li",
      "#clinics li",
      ".location-list li",
      "article.location .location-name",
      ".clinic-name",
    ]

    for (const selector of potentialSelectors) {
      if ($(selector).length > 0) {
        $(selector).each((i, el) => {
          clinics.push($(el).text().trim())
        })
        break // Stop after first successful selector
      }
    }

    // Fallback if no specific selectors found
    if (clinics.length === 0) {
      $("li").each((i, el) => {
        const text = $(el).text().trim()
        // A simple heuristic to guess if it's a location
        if (text.length > 5 && text.length < 100 && !text.startsWith("Phone")) {
          clinics.push(text)
        }
      })
    }

    // Remove duplicates and filter out empty strings
    clinics = [...new Set(clinics)].filter(Boolean)

    if (clinics.length === 0) {
      return { success: false, error: "Could not find any clinics on the page." }
    }

    const supabase = createClient()
    const { error } = await supabase.from("brands").update({ clinics }).eq("id", brandId)

    if (error) {
      console.error("Error updating clinics in DB:", error)
      return { success: false, error: "Failed to save clinics to the database." }
    }

    revalidatePath("/admin")
    return { success: true, message: `Successfully imported ${clinics.length} clinics.`, clinics }
  } catch (e) {
    const error = e as Error
    console.error("Error scraping clinics:", error)
    return { success: false, error: error.message }
  }
}

export async function runSeed() {
  try {
    const command = "pnpm tsx lib/seed-database.ts"
    const { stdout, stderr } = await execAsync(command)

    if (stderr) {
      console.error(`Seed script stderr: ${stderr}`)
      // Check for specific, non-fatal errors if any
      if (!stderr.includes("Warning:")) {
        return { success: false, error: stderr }
      }
    }

    revalidatePath("/admin")
    return { success: true, message: `Database seeded successfully. Output: ${stdout}` }
  } catch (e) {
    const error = e as Error & { stdout?: string; stderr?: string }
    console.error("Error running seed script:", error)
    return { success: false, error: error.stderr || error.message }
  }
}

export async function autoAssignPdfs(brandId: number) {
  const supabase = createClient()

  try {
    const { data: brand, error: brandError } = await supabase.from("brands").select("slug").eq("id", brandId).single()

    if (brandError) throw brandError

    const sampleDir = path.join(process.cwd(), "public", "samples", brand.slug)
    const files = await fs.readdir(sampleDir)
    const pdfFiles = files.filter((f) => f.toLowerCase().endsWith(".pdf"))

    if (pdfFiles.length === 0) {
      return { success: false, error: "No PDF files found in the sample directory." }
    }

    const { data: items, error: itemsError } = await supabase.from("items").select("id, code").eq("brand_id", brandId)

    if (itemsError) throw itemsError

    const itemCodeMap = new Map(items.map((item) => [item.code, item.id]))
    let updatedCount = 0
    const updatePromises = []

    for (const pdfFile of pdfFiles) {
      const code = path.basename(pdfFile, ".pdf").toUpperCase()
      if (itemCodeMap.has(code)) {
        const itemId = itemCodeMap.get(code)
        const filePath = path.join(sampleDir, pdfFile)
        const fileBuffer = await fs.readFile(filePath)

        const { url } = await put(`pdfs/${brand.slug}/${pdfFile}`, fileBuffer, {
          access: "public",
          contentType: "application/pdf",
        })

        updatePromises.push(supabase.from("items").update({ pdf_url: url }).eq("id", itemId))
        updatedCount++
      }
    }

    const results = await Promise.all(updatePromises)
    const failedUpdates = results.filter((res) => res.error)

    if (failedUpdates.length > 0) {
      console.error(
        "Some PDF assignments failed:",
        failedUpdates.map((f) => f.error),
      )
      return {
        success: false,
        error: `Assigned ${updatedCount - failedUpdates.length} PDFs, but ${failedUpdates.length} assignments failed.`,
      }
    }

    revalidatePath("/admin")
    revalidatePath(`/admin/editor/${brand.slug}`)
    return { success: true, message: `Successfully assigned ${updatedCount} PDFs.` }
  } catch (e) {
    const error = e as Error
    console.error("Error in autoAssignPdfs:", error)
    return { success: false, error: error.message }
  }
}

export async function reloadSchemaCache() {
  const supabase = createClient()
  try {
    const { error } = await supabase.rpc("reload_schema_cache")
    if (error) throw error
    revalidatePath("/admin")
    return { success: true, message: "Schema cache reloaded." }
  } catch (e) {
    const error = e as Error
    console.error("Error reloading schema cache:", error)
    return { success: false, error: error.message }
  }
}

export async function refreshSubmissions() {
  revalidatePath("/admin")
  return { success: true, message: "Submissions refreshed." }
}

export async function markOrderAsComplete(
  submissionId: number,
  completionData: {
    completion_courier: string
    completion_tracking: string
    completion_notes: string
  },
) {
  const supabase = createClient()
  try {
    const { data: updatedSubmission, error } = await supabase
      .from("submissions")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        ...completionData,
      })
      .eq("id", submissionId)
      .select(
        `
        *,
        brand:brands (
          name,
          logo
        )
      `,
      )
      .single()

    if (error) {
      console.error("Error marking order as complete:", error)
      return { success: false, error: "Failed to update order status." }
    }

    if (updatedSubmission) {
      try {
        await sendOrderCompletionEmail(updatedSubmission)
        console.log(`Completion email sent for submission ${submissionId}`)
      } catch (emailError) {
        console.error(`Failed to send completion email for submission ${submissionId}:`, emailError)
        // Don't block the response for email failure, but maybe log it or notify admin
      }
    }

    revalidatePath("/admin")
    return { success: true, message: "Order marked as complete." }
  } catch (e) {
    const error = e as Error
    console.error("Unexpected error in markOrderAsComplete:", error)
    return { success: false, error: error.message }
  }
}
