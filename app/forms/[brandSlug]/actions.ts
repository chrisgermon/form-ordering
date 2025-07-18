"use server"

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"
import { sendOrderEmail } from "@/lib/email"
import { generatePdf } from "@/lib/pdf"
import type { ActionState } from "@/lib/types"
import type { FormData } from "formdata-node"

export async function submitOrder(prevState: ActionState, formData: FormData): Promise<ActionState> {
  console.log("[ACTION] submitOrder: Received form submission.")

  const supabase = createClient()

  const brandId = formData.get("brandId") as string
  const brandSlug = formData.get("brandSlug") as string
  const locationId = formData.get("location_id") as string
  const orderedBy = formData.get("ordered_by") as string
  const orderedByEmail = formData.get("ordered_by_email") as string
  const notes = formData.get("notes") as string

  const items: { id: string; name: string; code: string | null; quantity: number }[] = []

  // 1. Fetch all items for the brand to get their names and codes
  const { data: allBrandItems, error: itemsError } = await supabase
    .from("product_items")
    .select("id, name, code")
    .eq("brand_id", brandId)

  if (itemsError) {
    console.error("[ACTION] submitOrder: Error fetching product items.", itemsError)
    return { success: false, message: "Database error: Could not verify items." }
  }

  // 2. Process form data to build the items list
  for (const [key, value] of formData.entries()) {
    if (key.startsWith("item_")) {
      const itemId = key.substring(5)
      const quantity = Number(value)
      if (quantity > 0) {
        const brandItem = allBrandItems.find((i) => String(i.id) === itemId)
        if (brandItem) {
          items.push({
            id: itemId,
            name: brandItem.name,
            code: brandItem.code,
            quantity,
          })
        }
      }
    }
  }

  if (items.length === 0) {
    return { success: false, message: "Please order at least one item." }
  }

  // 3. Insert into the database
  const { data: submission, error: submissionError } = await supabase
    .from("submissions")
    .insert({
      brand_id: brandId,
      location_id: locationId,
      ordered_by: orderedBy,
      ordered_by_email: orderedByEmail,
      notes: notes,
      items: items, // Assuming 'items' is a JSONB column
    })
    .select("id")
    .single()

  if (submissionError || !submission) {
    console.error("[ACTION] submitOrder: Error inserting submission.", submissionError)
    return { success: false, message: `Database error: ${submissionError?.message || "Failed to save order."}` }
  }

  console.log(`[ACTION] submitOrder: Successfully saved submission with ID: ${submission.id}`)

  // 4. Generate PDF and send email (asynchronously)
  try {
    const { data: brandData } = await supabase.from("brands").select("name, logo").eq("id", brandId).single()
    const { data: locationData } = await supabase
      .from("clinic_locations")
      .select("name, address")
      .eq("id", locationId)
      .single()

    if (brandData && locationData) {
      const pdfBuffer = await generatePdf({
        brandName: brandData.name,
        brandLogo: brandData.logo,
        locationName: locationData.name,
        locationAddress: locationData.address,
        orderedBy,
        orderedByEmail,
        notes,
        items,
        submissionId: submission.id,
      })

      await sendOrderEmail({
        brandName: brandData.name,
        submissionId: submission.id,
        pdfBuffer,
      })
      console.log(`[ACTION] submitOrder: Email sent for submission ID: ${submission.id}`)
    }
  } catch (err) {
    console.error("[ACTION] submitOrder: Failed to generate PDF or send email.", err)
    // Don't fail the whole request if this part fails, just log it.
  }

  revalidatePath(`/forms/${brandSlug}`)
  return {
    success: true,
    message: "Order submitted successfully!",
    submissionId: submission.id,
  }
}
