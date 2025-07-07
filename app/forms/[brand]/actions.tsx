"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { generatePdf } from "@/lib/pdf"
import { sendOrderEmail } from "@/lib/email"
import { z } from "zod"
import type { Section } from "@/lib/types"

const OrderSchema = z.object({
  brandId: z.string().uuid(),
  ordered_by: z.string().min(1, "Your name is required."),
  email: z.string().email("A valid email is required."),
  order_number: z.string().optional(),
  notes: z.string().optional(),
  items: z.record(z.string(), z.string()),
})

export async function submitOrder(prevState: any, formData: FormData) {
  const supabase = createAdminClient()
  const rawData = {
    brandId: formData.get("brandId"),
    ordered_by: formData.get("ordered_by"),
    email: formData.get("email"),
    order_number: formData.get("order_number"),
    notes: formData.get("notes"),
    items: Object.fromEntries(Array.from(formData.entries()).filter(([key]) => key.startsWith("item-"))),
  }

  const validatedFields = OrderSchema.safeParse(rawData)

  if (!validatedFields.success) {
    return {
      success: false,
      message: "Invalid data provided. Please check the form.",
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }

  const { brandId, ...orderData } = validatedFields.data

  const { data: brand, error: brandError } = await supabase.from("brands").select("*").eq("id", brandId).single()

  if (brandError || !brand) {
    return { success: false, message: "Could not find brand information." }
  }

  const { data: submission, error: submissionError } = await supabase
    .from("submissions")
    .insert({
      brand_id: brandId,
      ordered_by: orderData.ordered_by,
      email: orderData.email,
      order_number: orderData.order_number,
      notes: orderData.notes,
      form_data: orderData.items,
      status: "Pending",
    })
    .select()
    .single()

  if (submissionError || !submission) {
    console.error("Submission Error:", submissionError)
    return { success: false, message: "Failed to save your order. Please try again." }
  }

  try {
    const { data: sections, error: sectionsError } = await supabase
      .from("sections")
      .select("*, items(*)")
      .eq("brand_id", brandId)
      .order("position", { ascending: true })
      .order("position", { foreignTable: "items", ascending: true })

    if (sectionsError) throw sectionsError

    const pdfBuffer = await generatePdf(submission, brand, sections as Section[])
    const pdfPath = `${submission.id}.pdf`

    const { error: uploadError } = await supabase.storage.from("order-pdfs").upload(pdfPath, pdfBuffer, {
      contentType: "application/pdf",
      upsert: true,
    })

    if (uploadError) throw uploadError

    const { data: publicUrlData } = supabase.storage.from("order-pdfs").getPublicUrl(pdfPath)

    const { error: updateError } = await supabase
      .from("submissions")
      .update({ pdf_url: publicUrlData.publicUrl })
      .eq("id", submission.id)

    if (updateError) throw updateError

    await sendOrderEmail(submission, brand, publicUrlData.publicUrl, pdfBuffer)
  } catch (error) {
    console.error("PDF/Email generation failed:", error)
    // The submission is saved, so we don't return a failure to the user, but we log it.
  }

  return { success: true, message: "Your order has been submitted successfully!" }
}
