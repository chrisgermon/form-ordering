"use server"

import { revalidatePath } from "next/cache"
import { createAdminClient } from "@/lib/supabase/admin"
import { z } from "zod"

const brandFormSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Brand name is required."),
  active: z.preprocess((val) => val === "on" || val === true, z.boolean()),
  logo_url: z.string().optional().nullable(),
  to_emails: z.string().optional(),
  cc_emails: z.string().optional(),
  bcc_emails: z.string().optional(),
  clinic_locations: z.string().optional(),
})

export async function createOrUpdateBrand(prevState: any, formData: FormData) {
  const supabase = createAdminClient()
  const validatedFields = brandFormSchema.safeParse(Object.fromEntries(formData.entries()))

  if (!validatedFields.success) {
    return {
      success: false,
      message: "Invalid form data.",
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }

  const { id, ...brandData } = validatedFields.data

  const stringToArray = (str: string | undefined) => (str ? str.split(",").map((s) => s.trim()) : [])

  const processedData = {
    ...brandData,
    to_emails: stringToArray(brandData.to_emails),
    cc_emails: stringToArray(brandData.cc_emails),
    bcc_emails: stringToArray(brandData.bcc_emails),
    clinic_locations: brandData.clinic_locations ? JSON.parse(brandData.clinic_locations) : [],
  }

  const query = id
    ? supabase.from("brands").update(processedData).eq("id", id)
    : supabase.from("brands").insert(processedData)

  const { error } = await query.select().single()

  if (error) {
    console.error("Error saving brand:", error)
    return { success: false, message: `Database error: ${error.message}` }
  }

  revalidatePath("/admin/dashboard")
  return { success: true, message: `Brand ${id ? "updated" : "created"} successfully.` }
}
