"use server"

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"
import { generatePdf } from "@/lib/pdf"
import { sendOrderEmail } from "@/lib/email"
import type { ActionState, PdfData } from "@/lib/types"

const FormSchema = z.object({
  brandSlug: z.string(),
  orderedBy: z.string().min(1, "Your name is required."),
  email: z.string().email("A valid email is required."),
  billToId: z.string().min(1, "Billing location is required."),
  deliverToId: z.string().min(1, "Delivery location is required."),
  notes: z.string().optional(),
})

export async function submitOrder(prevState: ActionState, formData: FormData): Promise<ActionState> {
  console.log("[ACTION] submitOrder: Received form submission.")

  const supabase = createClient()

  const validatedFields = FormSchema.safeParse({
    brandSlug: formData.get("brandSlug"),
    orderedBy: formData.get("orderedBy"),
    email: formData.get("email"),
    billToId: formData.get("billToId"),
    deliverToId: formData.get("deliverToId"),
    notes: formData.get("notes"),
  })

  if (!validatedFields.success) {
    return {
      success: false,
      message: "Invalid form data. Please check the fields.",
    }
  }

  const { brandSlug, orderedBy, email, billToId, deliverToId, notes } = validatedFields.data

  const items: Record<string, string> = {}
  for (const [key, value] of formData.entries()) {
    if (key.startsWith("item-")) {
      items[key.replace("item-", "")] = value as string
    }
  }

  // Fetch brand and location details for PDF and email
  const { data: brand, error: brandError } = await supabase
    .from("brands")
    .select("id, name, logo, emails")
    .eq("slug", brandSlug)
    .single()

  if (brandError || !brand) {
    return { success: false, message: "Could not find brand information." }
  }

  const { data: deliveryLocation, error: locError } = await supabase
    .from("clinic_locations")
    .select("name, address")
    .eq("id", deliverToId)
    .single()

  if (locError || !deliveryLocation) {
    return { success: false, message: "Could not find delivery location." }
  }

  // Insert submission into the database
  const { data: submission, error: submissionError } = await supabase
    .from("submissions")
    .insert({
      brand_id: brand.id,
      location_id: deliverToId,
      ordered_by: orderedBy,
      ordered_by_email: email,
      notes: notes,
      items: items,
      status: "Pending",
    })
    .select("id")
    .single()

  if (submissionError || !submission) {
    console.error("[ACTION] submitOrder: Error inserting submission.", submissionError)
    return { success: false, message: `Database Error: ${submissionError?.message}` }
  }

  console.log(`[ACTION] submitOrder: Successfully saved submission with ID: ${submission.id}`)

  // Generate PDF
  const pdfData: PdfData = {
    brandName: brand.name,
    brandLogo: brand.logo,
    locationName: deliveryLocation.name,
    locationAddress: deliveryLocation.address,
    orderedBy: orderedBy,
    orderedByEmail: email,
    notes: notes,
    items: [], // This needs to be populated correctly if PDF needs item details
    submissionId: submission.id,
  }

  try {
    const pdfBuffer = await generatePdf(pdfData)
    await sendOrderEmail({
      to: brand.emails || [],
      from: `orders@${brandSlug}.com`,
      subject: `New Order from ${orderedBy} - #${submission.id.substring(0, 6)}`,
      brandName: brand.name,
      submissionId: submission.id,
      pdfBuffer,
    })
    console.log(`[ACTION] submitOrder: Email sent for submission ID: ${submission.id}`)
  } catch (error) {
    console.error("Failed to generate PDF or send email:", error)
    // Decide if this should be a critical failure
  }

  revalidatePath(`/forms/${brandSlug}/success`)
  revalidatePath("/admin") // This line ensures the admin dashboard is updated

  redirect(`/forms/${brandSlug}/success?submissionId=${submission.id}`)
}
