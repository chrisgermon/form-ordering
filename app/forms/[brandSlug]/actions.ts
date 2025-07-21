"use server"

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { generatePdf } from "@/lib/pdf"
import { sendOrderEmail } from "@/lib/email"
import type { ActionState, PdfData } from "@/lib/types"

const formSchema = z.object({
  brandId: z.string().uuid(),
  brandSlug: z.string(),
  ordered_by: z.string().min(1, "Your name is required."),
  ordered_by_email: z.string().email("A valid email is required."),
  location_id: z.string().uuid(),
  notes: z.string().optional(),
})

export async function submitOrder(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = createClient()
  const rawData = Object.fromEntries(formData.entries())

  const parsed = formSchema.safeParse(rawData)

  if (parsed.success === false) {
    console.error("Form validation failed:", parsed.error.flatten().fieldErrors)
    return {
      success: false,
      message: "Invalid form data. Please check your entries.",
    }
  }

  const brandId = parsed.data.brandId
  const brandSlug = parsed.data.brandSlug
  const ordered_by = parsed.data.ordered_by
  const ordered_by_email = parsed.data.ordered_by_email
  const location_id = parsed.data.location_id
  const notes = parsed.data.notes

  const items: Record<string, number> = {}
  for (const [key, value] of formData.entries()) {
    if (key.startsWith("item_")) {
      const itemId = key.replace("item_", "")
      const quantity = Number(value)
      if (quantity > 0) {
        items[itemId] = quantity
      }
    }
  }

  if (Object.keys(items).length === 0) {
    return { success: false, message: "Please order at least one item." }
  }

  try {
    const submissionInsert = {
      brand_id: brandId,
      location_id: location_id,
      ordered_by: ordered_by,
      ordered_by_email: ordered_by_email,
      notes: notes,
      status: "New",
    }

    const { data: submission, error: submissionError } = await supabase
      .from("submissions")
      .insert(submissionInsert)
      .select()
      .single()

    if (submissionError) {
      throw submissionError
    }

    const submissionItems = Object.entries(items).map(([product_item_id, quantity]) => {
      return {
        submission_id: submission.id,
        product_item_id: product_item_id,
        quantity: quantity,
      }
    })

    const { error: itemsError } = await supabase.from("submission_items").insert(submissionItems)

    if (itemsError) {
      throw itemsError
    }

    // Fetch data for PDF and Email
    const { data: brandData } = await supabase.from("brands").select("name, logo, emails").eq("id", brandId).single()
    const { data: locationData } = await supabase
      .from("clinic_locations")
      .select("name, address")
      .eq("id", location_id)
      .single()
    const { data: productItemsData } = await supabase
      .from("product_items")
      .select("id, name, code")
      .in("id", Object.keys(items))

    if (!brandData || !locationData || !productItemsData) {
      throw new Error("Failed to fetch related data for PDF generation.")
    }

    const pdfData: PdfData = {
      brandName: brandData.name,
      brandLogo: brandData.logo,
      locationName: locationData.name,
      locationAddress: locationData.address,
      orderedBy: ordered_by,
      orderedByEmail: ordered_by_email,
      notes: notes || null,
      items: productItemsData.map((item) => ({
        ...item,
        quantity: items[item.id] || 0,
      })),
      submissionId: submission.id,
      createdAt: new Date(submission.created_at),
    }

    const pdfBuffer = await generatePdf(pdfData)

    const emailPayload = {
      brandName: brandData.name,
      submissionId: submission.id,
      pdfBuffer: pdfBuffer,
      to: brandData.emails || [],
      replyTo: ordered_by_email,
    }
    await sendOrderEmail(emailPayload)

    revalidatePath("/admin")
    revalidatePath(`/forms/${brandSlug}`)

    return {
      success: true,
      message: "Your order has been submitted successfully.",
      submissionId: submission.id,
    }
  } catch (error) {
    console.error("Error submitting order:", error)
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred."
    return {
      success: false,
      message: `There was a problem submitting your order: ${errorMessage}`,
    }
  }
}
