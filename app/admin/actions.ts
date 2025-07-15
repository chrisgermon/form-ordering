"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { sendOrderCompletionEmail } from "@/lib/email"
import type { Submission, Clinic } from "@/lib/types"
import { generateObject } from "ai"
import { xai } from "@ai-sdk/xai"
import { z } from "zod"
import { seedDatabase } from "@/lib/seed-database"

export async function runSeed() {
  try {
    await seedDatabase()
    revalidatePath("/admin")
    return { success: true, message: "Database seeded successfully!" }
  } catch (error) {
    console.error("Seeding failed:", error)
    return { success: false, message: `Seeding failed: ${error instanceof Error ? error.message : "Unknown error"}` }
  }
}

export async function autoAssignPdfs() {
  const supabase = createClient()
  try {
    const { data: items, error: itemsError } = await supabase.from("product_items").select("id, code")
    if (itemsError) throw itemsError

    const { data: files, error: filesError } = await supabase.from("uploaded_files").select("id, original_name, url")
    if (filesError) throw filesError

    let assignments = 0
    const unmatchedFiles: string[] = []

    const itemCodeMap = new Map(items.map((item) => [item.code.toUpperCase(), item.id]))

    for (const file of files) {
      const fileCode = file.original_name.replace(/\.pdf$/i, "").toUpperCase()
      if (itemCodeMap.has(fileCode)) {
        const itemId = itemCodeMap.get(fileCode)
        const { error: updateError } = await supabase
          .from("product_items")
          .update({ sample_link: file.url })
          .eq("id", itemId)

        if (updateError) {
          console.error(`Failed to update item ${fileCode}:`, updateError.message)
        } else {
          assignments++
        }
      } else {
        unmatchedFiles.push(file.original_name)
      }
    }

    revalidatePath("/admin", "layout")
    revalidatePath("/forms", "layout")

    let message = `${assignments} PDF(s) were successfully assigned.`
    if (unmatchedFiles.length > 0) {
      message += ` The following files could not be matched: ${unmatchedFiles.join(", ")}.`
    }
    if (assignments === 0 && unmatchedFiles.length === 0) {
      message = "No new PDFs found to assign."
    }

    return { success: true, message }
  } catch (error) {
    console.error("Error auto-assigning PDFs:", error)
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred."
    return { success: false, message: `Failed to assign PDFs: ${errorMessage}` }
  }
}

export async function reloadSchemaCache() {
  const supabase = createClient()
  try {
    const { error } = await supabase.rpc("reload_schema_cache")
    if (error) {
      throw error
    }
    revalidatePath("/admin")
    return { success: true, message: "Schema cache reloaded successfully." }
  } catch (error) {
    console.error("Error reloading schema cache:", error)
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred."
    return { success: false, message: `Failed to reload schema cache: ${errorMessage}` }
  }
}

export async function refreshSubmissions() {
  revalidatePath("/admin")
}

export async function scrapeClinicsFromWebsite(
  url: string,
): Promise<{ success: boolean; data?: Clinic[]; error?: string }> {
  if (!url) {
    return { success: false, error: "URL is required." }
  }

  console.log(`Scraping clinics from URL: ${url} using Grok`)

  try {
    const { object } = await generateObject({
      model: xai("grok-3"),
      schema: z.object({
        clinics: z.array(
          z.object({
            name: z.string().describe("The full name of the clinic or practice."),
            address: z.string().describe("The full street address of the clinic."),
            phone: z.string().optional().describe("The primary phone number."),
            email: z.string().email().optional().describe("The primary contact email address."),
          }),
        ),
      }),
      prompt: `Scrape the content of the website at the URL ${url}. Identify and extract a list of all clinic locations mentioned on the page. For each clinic, provide its name, full address, phone number, and email address if available.`,
    })
    console.log("Successfully scraped clinics:", object.clinics)
    return { success: true, data: object.clinics }
  } catch (error) {
    console.error("Error scraping clinics with Grok:", error)
    return { success: false, error: "Failed to scrape clinic data. The website structure might be unsupported." }
  }
}

export async function deleteBrand(slug: string) {
  const supabase = createClient()
  const { error } = await supabase.from("brands").delete().eq("slug", slug)

  if (error) {
    console.error("Error deleting brand:", error)
    return { success: false, message: error.message }
  }

  revalidatePath("/admin")
  return { success: true, message: "Brand deleted successfully." }
}

export async function updateSubmissionStatus(
  submissionId: number,
  isComplete: boolean,
  completionDetails?: {
    courier: string
    trackingNumber: string
    notes: string
  },
) {
  const supabase = createClient()

  const updatePayload: Partial<Submission> & { status: "completed" | "pending" } = {
    is_complete: isComplete,
    status: isComplete ? "completed" : "pending",
  }

  if (isComplete) {
    updatePayload.completed_at = new Date().toISOString()
    if (completionDetails) {
      updatePayload.completion_courier = completionDetails.courier
      updatePayload.completion_tracking = completionDetails.trackingNumber
      updatePayload.completion_notes = completionDetails.notes
    }
  } else {
    updatePayload.completed_at = null
    updatePayload.completion_courier = null
    updatePayload.completion_tracking = null
    updatePayload.completion_notes = null
  }

  const { error: updateError } = await supabase.from("submissions").update(updatePayload).eq("id", submissionId)

  if (updateError) {
    console.error("Error updating submission status:", updateError)
    return { success: false, message: updateError.message }
  }

  if (isComplete) {
    const { data: submission, error: fetchError } = await supabase
      .from("submissions")
      .select("*, brand:brands(*)")
      .eq("id", submissionId)
      .single()

    if (fetchError || !submission) {
      console.error("Error fetching submission for email:", fetchError)
      // Don't block success response if email fails
    } else {
      try {
        await sendOrderCompletionEmail(submission as any)
      } catch (emailError) {
        console.error("Failed to send completion email:", emailError)
        // Don't block the success response for a failed email
      }
    }
  }

  revalidatePath("/admin")
  return { success: true, message: "Order status updated." }
}
