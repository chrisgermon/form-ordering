"use server"

import { revalidatePath } from "next/cache"
import { createAdminClient } from "@/lib/supabase/admin"
import { z } from "zod"
import { sendCompletionEmail } from "@/lib/email"
import type { Submission, AllowedIp } from "@/lib/types"
import { promises as fs } from "fs"
import path from "path"

const markCompleteSchema = z.object({
  submissionId: z.string(),
  dispatch_date: z.string().optional().nullable(),
  tracking_link: z.string().optional().nullable(),
  dispatch_notes: z.string().optional().nullable(),
})

export async function markSubmissionAsComplete(prevState: any, formData: FormData) {
  const supabase = createAdminClient()
  const validatedFields = markCompleteSchema.safeParse({
    submissionId: formData.get("submissionId"),
    dispatch_date: formData.get("dispatch_date"),
    tracking_link: formData.get("tracking_link"),
    dispatch_notes: formData.get("dispatch_notes"),
  })

  if (!validatedFields.success) {
    return {
      success: false,
      message: "Invalid data provided.",
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }

  const { submissionId, ...updateData } = validatedFields.data

  const { data: submission, error: fetchError } = await supabase
    .from("submissions")
    .select("*, brands(*)")
    .eq("id", submissionId)
    .single()

  if (fetchError || !submission) {
    return { success: false, message: "Failed to find submission." }
  }

  const { error } = await supabase
    .from("submissions")
    .update({
      ...updateData,
      status: "Complete",
      dispatch_date: updateData.dispatch_date || null,
    })
    .eq("id", submissionId)

  if (error) {
    console.error("Error marking order as complete:", error)
    return { success: false, message: `Database Error: ${error.message}` }
  }

  try {
    await sendCompletionEmail(submission as Submission, updateData)
  } catch (emailError) {
    console.error("Failed to send completion email:", emailError)
  }

  revalidatePath("/admin/dashboard")
  return { success: true, message: "Order marked as complete!" }
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
