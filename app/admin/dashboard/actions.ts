"use server"

import { revalidatePath } from "next/cache"
import { createAdminClient } from "@/lib/supabase/admin"
import { z } from "zod"
import type { AllowedIp, Submission, Brand } from "@/lib/types"
import { sendCompletionEmail } from "@/lib/email"
import { promises as fs } from "fs"
import path from "path"

const BrandFormSchema = z.object({
  id: z.string().optional().or(z.literal("")),
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  active: z.preprocess((val) => val === "on" || val === true, z.boolean()),
})

export async function createOrUpdateBrand(prevState: any, formData: FormData) {
  const supabase = createAdminClient()

  const rawData = Object.fromEntries(formData.entries())
  const validatedFields = BrandFormSchema.safeParse(rawData)

  if (!validatedFields.success) {
    console.error("Validation Error:", validatedFields.error.flatten())
    return { success: false, message: "Invalid data provided." }
  }

  const { id, ...brandData } = validatedFields.data
  const logoFile = formData.get("logo") as File
  let logoUrl: string | undefined = undefined

  if (logoFile && logoFile.size > 0) {
    const filePath = `public/${Date.now()}-${logoFile.name}`
    const { error: uploadError } = await supabase.storage.from("brand-assets").upload(filePath, logoFile)

    if (uploadError) {
      console.error("Logo upload error:", uploadError)
      return { success: false, message: "Failed to upload logo." }
    }

    const { data: publicUrlData } = supabase.storage.from("brand-assets").getPublicUrl(filePath)
    logoUrl = publicUrlData.publicUrl
  }

  const dataToUpsert: any = { ...brandData }
  if (logoUrl) {
    dataToUpsert.logo_url = logoUrl
  }

  if (id) {
    // Update
    const { error } = await supabase.from("brands").update(dataToUpsert).eq("id", id)
    if (error) {
      console.error("Brand update error:", error)
      return { success: false, message: `Failed to update brand: ${error.message}` }
    }
    revalidatePath("/admin/dashboard")
    return { success: true, message: "Brand updated successfully." }
  } else {
    // Create
    const { error } = await supabase.from("brands").insert(dataToUpsert).select().single()
    if (error) {
      console.error("Brand create error:", error)
      return { success: false, message: `Failed to create brand: ${error.message}` }
    }
    revalidatePath("/admin/dashboard")
    return { success: true, message: "Brand created successfully." }
  }
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
  trackingLink: z.string().url().optional().or(z.literal("")).nullable(),
  notes: z.string().optional().nullable(),
})

export async function markSubmissionAsComplete(
  prevState: any,
  formData: FormData,
): Promise<{ success: boolean; message: string; errors?: any; data?: any }> {
  const validatedFields = MarkCompleteSchema.safeParse({
    submissionId: formData.get("submissionId"),
    dispatchDate: formData.get("dispatchDate"),
    trackingLink: formData.get("trackingLink"),
    notes: formData.get("notes"),
  })

  if (!validatedFields.success) {
    return {
      success: false,
      message: "Invalid data provided.",
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }

  const { submissionId, dispatchDate, trackingLink, notes } = validatedFields.data
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from("submissions")
    .update({
      status: "Complete",
      dispatch_date: dispatchDate || null,
      tracking_link: trackingLink || null,
      dispatch_notes: notes || null,
    })
    .eq("id", submissionId)
    .select(
      `*,
      brands (
        id, name, slug, logo_url, to_emails, cc_emails, bcc_emails, subject_line
      )
    `,
    )
    .single()

  if (error) {
    console.error("Error marking submission as complete:", error)
    return { success: false, message: "Database error: Could not update submission." }
  }

  if (data && data.brands) {
    const brand = data.brands as unknown as Brand
    await sendCompletionEmail(data as Submission, brand, brand.logo_url)
  }

  revalidatePath("/admin/dashboard")
  return { success: true, message: `Order #${data.order_number} marked as complete.`, data }
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
