"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { generatePdf } from "@/lib/pdf"
import { sendOrderEmail } from "@/lib/email"
import { revalidatePath } from "next/cache"
import type { Brand, Submission } from "@/lib/types"

export async function submitOrder(brand: Brand, prevState: any, formData: FormData) {
  const supabase = createAdminClient()

  const rawData: { [key: string]: any } = {
    items: [],
  }
  const itemMap: { [key: string]: any } = {}

  for (const [key, value] of formData.entries()) {
    const itemMatch = key.match(/items\[(\d+)\]\.(.+)/)
    if (itemMatch) {
      const index = itemMatch[1]
      const property = itemMatch[2]
      if (!itemMap[index]) {
        itemMap[index] = {}
      }
      itemMap[index][property] = value
    } else {
      rawData[key] = value
    }
  }
  rawData.items = Object.values(itemMap)
  rawData.urgent = rawData.urgent === "on"

  const submissionData = {
    brand_id: brand.id,
    patient_name: rawData.patient_name,
    patient_dob: rawData.patient_dob,
    patient_phone: rawData.patient_phone,
    patient_email: rawData.patient_email,
    patient_medicare: rawData.patient_medicare,
    referrer_name: rawData.referrer_name,
    referrer_provider_number: rawData.referrer_provider_number,
    referrer_email: rawData.referrer_email,
    clinic_name: rawData.clinic_name,
    urgent: rawData.urgent,
    status: "Pending",
    form_data: rawData,
  }

  const { data: newSubmission, error: submissionError } = await supabase
    .from("submissions")
    .insert(submissionData)
    .select()
    .single()

  if (submissionError) {
    console.error("Error creating submission:", submissionError)
    return { success: false, message: `Database Error: ${submissionError.message}` }
  }

  try {
    const pdfBuffer = await generatePdf(newSubmission as Submission, brand)
    await sendOrderEmail(newSubmission as Submission, brand, pdfBuffer)
  } catch (error) {
    console.error("Error generating PDF or sending email:", error)
    // Do not fail the entire submission if this part fails, but log it.
  }

  revalidatePath("/admin/dashboard")
  return { success: true, message: `Order #${newSubmission.order_number} submitted successfully!` }
}
