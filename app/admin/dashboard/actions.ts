"use server"

import { createServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { promises as fs } from "fs"
import path from "path"
import { createAdminClient } from "@/lib/supabase/admin"
import { sendCompletionEmail } from "@/lib/email"
import { markCompleteSchema } from "@/lib/schemas"

export async function getSubmissions() {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from("submissions")
    .select(
      `
      *,
      brands (name)
    `,
    )
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching submissions:", error)
    return []
  }
  return data
}

export async function getBrands() {
  const supabase = createServerClient()
  const { data, error } = await supabase.from("brands").select("*")
  if (error) {
    console.error("Error fetching brands:", error)
    return []
  }
  return data
}

export async function deleteBrand(id: string) {
  const supabase = createServerClient()
  const { error } = await supabase.from("brands").delete().eq("id", id)
  if (error) {
    return { success: false, message: `Failed to delete brand: ${error.message}` }
  }
  revalidatePath("/admin/dashboard")
  return { success: true, message: "Brand deleted successfully." }
}

export async function getAllowedIps() {
  const supabase = createServerClient()
  const { data, error } = await supabase.from("allowed_ips").select("*")
  if (error) {
    console.error("Error fetching allowed IPs:", error)
    return []
  }
  return data
}

export async function addAllowedIp(ipAddress: string) {
  const supabase = createServerClient()
  const { data, error } = await supabase.from("allowed_ips").insert({ ip_address: ipAddress }).select().single()

  if (error) {
    return { success: false, message: `Failed to add IP: ${error.message}` }
  }
  revalidatePath("/admin/dashboard")
  return { success: true, message: "IP address added successfully.", data }
}

export async function deleteAllowedIp(id: string) {
  const supabase = createServerClient()
  const { error } = await supabase.from("allowed_ips").delete().eq("id", id)
  if (error) {
    return { success: false, message: `Failed to delete IP: ${error.message}` }
  }
  revalidatePath("/admin/dashboard")
  return { success: true, message: "IP address deleted successfully." }
}

export async function getMigrationScripts() {
  try {
    const scriptsDir = path.join(process.cwd(), "scripts")
    const files = await fs.readdir(scriptsDir)
    return files.filter((file) => file.endsWith(".sql"))
  } catch (error) {
    console.error("Error reading migration scripts:", error)
    return []
  }
}

export async function runSchemaMigration(scriptName: string) {
  try {
    const supabaseAdmin = createAdminClient()
    const scriptPath = path.join(process.cwd(), "scripts", scriptName)
    const sql = await fs.readFile(scriptPath, "utf-8")
    const { error } = await supabaseAdmin.rpc("run_sql", { sql_query: sql })

    if (error) {
      return { success: false, message: `Migration failed: ${error.message}` }
    }
    return { success: true, message: `Migration ${scriptName} ran successfully.` }
  } catch (error: any) {
    return { success: false, message: `Error running migration: ${error.message}` }
  }
}

export async function markOrderAsComplete(submissionId: string, formData: FormData) {
  const supabase = createServerClient()

  const values = {
    completion_notes: formData.get("completion_notes"),
    completed_by: formData.get("completed_by"),
  }

  const validatedFields = markCompleteSchema.safeParse(values)

  if (!validatedFields.success) {
    return {
      success: false,
      message: "Validation failed.",
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }

  const { completion_notes, completed_by } = validatedFields.data

  const { data: submission, error: updateError } = await supabase
    .from("submissions")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
      completion_notes: completion_notes || null,
      completed_by: completed_by || null,
    })
    .eq("id", submissionId)
    .select()
    .single()

  if (updateError) {
    return { success: false, message: `Database error: ${updateError.message}` }
  }

  if (submission.patient_email) {
    await sendCompletionEmail({
      to: submission.patient_email,
      patientName: submission.patient_name,
      notes: completion_notes,
    })
  }

  revalidatePath("/admin/dashboard")
  return { success: true, message: "Order marked as complete." }
}
