"use server"

import { createClient } from "@/utils/supabase/server"
import { sendOrderEmail } from "@/lib/email"

type FormState = {
  success: boolean
  message: string
  submissionId?: string | null
}

export async function submitOrder(prevState: FormState, formData: FormData): Promise<FormState> {
  console.log("[ACTION] submitOrder: Received form data.")

  const supabase = createClient()

  const brandId = formData.get("brandId") as string
  const brandSlug = formData.get("brandSlug") as string
  const locationId = formData.get("location_id") as string
  const orderedBy = formData.get("ordered_by") as string
  const orderedByEmail = formData.get("ordered_by_email") as string
  const notes = formData.get("notes") as string

  // Basic validation
  if (!brandId || !locationId || !orderedBy || !orderedByEmail) {
    return { success: false, message: "Missing required fields." }
  }

  const items: { id: string; quantity: number }[] = []
  for (const [key, value] of formData.entries()) {
    if (key.startsWith("item_")) {
      const itemId = key.replace("item_", "")
      const quantity = Number(value)
      if (quantity > 0) {
        items.push({ id: itemId, quantity })
      }
    }
  }

  if (items.length === 0) {
    return { success: false, message: "You must order at least one item." }
  }

  try {
    // 1. Insert into submissions table
    const { data: submissionData, error: submissionError } = await supabase
      .from("submissions")
      .insert({
        brand_id: brandId,
        location_id: locationId,
        ordered_by: orderedBy,
        ordered_by_email: orderedByEmail,
        notes: notes,
      })
      .select("id")
      .single()

    if (submissionError) throw submissionError
    const submissionId = submissionData.id
    console.log(`[ACTION] submitOrder: Created submission with ID: ${submissionId}`)

    // 2. Insert into submission_items table
    const submissionItems = items.map((item) => ({
      submission_id: submissionId,
      item_id: item.id,
      quantity: item.quantity,
    }))

    const { error: itemsError } = await supabase.from("submission_items").insert(submissionItems)

    if (itemsError) throw itemsError
    console.log(`[ACTION] submitOrder: Inserted ${submissionItems.length} items for submission ${submissionId}`)

    // 3. Fetch all data needed for the email
    const { data: fullSubmissionData, error: fetchError } = await supabase
      .from("submissions")
      .select(`
        *,
        brand:brands(name),
        location:clinic_locations(name, address),
        submission_items:submission_items(
          quantity,
          item:product_items(name, code)
        )
      `)
      .eq("id", submissionId)
      .single()

    if (fetchError) throw fetchError

    // 4. Send email
    await sendOrderEmail(fullSubmissionData)
    console.log(`[ACTION] submitOrder: Email sent for submission ${submissionId}`)

    return {
      success: true,
      message: "Order submitted successfully!",
      submissionId: submissionId,
    }
  } catch (error: any) {
    console.error("[ACTION] submitOrder: An error occurred:", error)
    return {
      success: false,
      message: `Failed to submit order: ${error.message}`,
    }
  }
}
