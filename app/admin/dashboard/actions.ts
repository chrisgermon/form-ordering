"use server"

import { revalidatePath } from "next/cache"
import { createAdminClient } from "@/lib/supabase/admin"
import { z } from "zod"
import type { AllowedIp, Submission, Brand } from "@/lib/types"
import { sendCompletionEmail } from "@/lib/email"
import { promises as fs } from "fs"
import path from "path"

const BrandSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Brand name is required."),
  slug: z.string().min(1, "Brand slug is required."),
  logo_url: z.string().url("Must be a valid URL.").optional().or(z.literal("")),
  active: z.boolean(),
})

export async function addBrand(prevState: any, formData: FormData) {
  const validatedFields = BrandSchema.safeParse(Object.fromEntries(formData.entries()))

  if (!validatedFields.success) {
    return { success: false, message: "Invalid data.", errors: validatedFields.error.flatten().fieldErrors }
  }

  const supabase = createAdminClient()
  const { error } = await supabase.from("brands").insert(validatedFields.data)

  if (error) {
    console.error("Error adding brand:", error)
    return { success: false, message: `Database Error: ${error.message}` }
  }

  revalidatePath("/admin/dashboard")
  return { success: true, message: "Brand added successfully." }
}

export async function updateBrand(prevState: any, formData: FormData) {
  const validatedFields = BrandSchema.safeParse(Object.fromEntries(formData.entries()))

  if (!validatedFields.success) {
    return { success: false, message: "Invalid data.", errors: validatedFields.error.flatten().fieldErrors }
  }

  const { id, ...brandData } = validatedFields.data
  if (!id) {
    return { success: false, message: "Brand ID is missing." }
  }

  const supabase = createAdminClient()
  const { error } = await supabase.from("brands").update(brandData).eq("id", id)

  if (error) {
    console.error("Error updating brand:", error)
    return { success: false, message: `Database Error: ${error.message}` }
  }

  revalidatePath("/admin/dashboard")
  revalidatePath(`/forms/${brandData.slug}`)
  return { success: true, message: "Brand updated successfully." }
}

export async function deleteBrand(id: string) {
  const supabase = createAdminClient()
  const { error } = await supabase.from("brands").delete().eq("id", id)

  if (error) {
    console.error("Error deleting brand:", error)
    return { success: false, message: `Database Error: ${error.message}` }
  }

  revalidatePath("/admin/dashboard")
  return { success: true, message: "Brand deleted successfully." }
}

const MarkCompleteSchema = z.object({
  submissionId: z.string().uuid(),
  dispatchDate: z.string().optional().nullable(),
  trackingLink: z.string().url("Please enter a valid URL.").optional().or(z.literal("")).nullable(),
  notes: z.string().optional().nullable(),
})

export async function markSubmissionAsComplete(
  prevState: any,
  formData: FormData,
): Promise<{ success: boolean; message: string; errors?: any }> {
  const rawData = {
    submissionId: formData.get("submissionId"),
    dispatchDate: formData.get("dispatchDate") || null,
    trackingLink: formData.get("trackingLink") || null,
    notes: formData.get("notes") || null,
  }

  const validatedFields = MarkCompleteSchema.safeParse(rawData)

  if (!validatedFields.success) {
    return {
      success: false,
      message: "Invalid data provided.",
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }

  const { submissionId, dispatchDate, trackingLink, notes } = validatedFields.data
  const supabase = createAdminClient()

  const { data: updatedSubmission, error } = await supabase
    .from("submissions")
    .update({
      status: "Complete",
      dispatch_date: dispatchDate,
      tracking_link: trackingLink,
      dispatch_notes: notes,
    })
    .eq("id", submissionId)
    .select(
      `
      *,
      brands (
        id, name, slug, logo_url, to_emails, cc_emails, bcc_emails, subject_line
      )
    `,
    )
    .single()

  if (error) {
    console.error("Error marking submission as complete:", error)
    return { success: false, message: `Database error: ${error.message}` }
  }

  if (!updatedSubmission) {
    return { success: false, message: "Could not find submission after update." }
  }

  if (updatedSubmission.brands) {
    const brand = updatedSubmission.brands as unknown as Brand
    await sendCompletionEmail(updatedSubmission as Submission, brand, brand.logo_url)
  }

  revalidatePath("/admin/dashboard")
  return { success: true, message: `Order #${updatedSubmission.order_number} marked as complete and email sent.` }
}

const IpSchema = z.string().ip({ version: "v4", message: "Invalid IP address." })

export async function addAllowedIp(ipAddress: string) {
  const validatedIp = IpSchema.safeParse(ipAddress)
  if (!validatedIp.success) {
    return { success: false, message: validatedIp.error.errors[0].message }
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase.from("allowed_ips").insert({ ip_address: validatedIp.data }).select().single()

  if (error) {
    console.error("Error adding IP:", error)
    return { success: false, message: "Failed to add IP address." }
  }

  revalidatePath("/admin/dashboard")
  return { success: true, message: "IP address added successfully.", data: data as AllowedIp }
}

export async function deleteAllowedIp(id: string) {
  const supabase = createAdminClient()
  const { error } = await supabase.from("allowed_ips").delete().eq("id", id)

  if (error) {
    console.error("Error deleting IP:", error)
    return { success: false, message: "Failed to delete IP address." }
  }

  revalidatePath("/admin/dashboard")
  return { success: true, message: "IP address deleted successfully." }
}

export async function runSchemaMigration(scriptName: string) {
  if (scriptName.includes("..") || !scriptName.endsWith(".sql")) {
    return { success: false, message: "Invalid script name." }
  }

  try {
    const scriptPath = path.join(process.cwd(), "scripts", scriptName)
    const sql = await fs.readFile(scriptPath, "utf8")

    const supabase = createAdminClient()
    const { error } = await supabase.rpc("run_sql", { sql_query: sql })

    if (error) {
      console.error(`Error running migration script ${scriptName}:`, error)
      return { success: false, message: `Migration failed: ${error.message}` }
    }

    return { success: true, message: `Script ${scriptName} executed successfully.` }
  } catch (e: any) {
    console.error(`Error reading migration script ${scriptName}:`, e)
    if (e.code === "ENOENT") {
      return { success: false, message: `Script file not found: ${scriptName}` }
    }
    return { success: false, message: "An unexpected error occurred." }
  }
}
