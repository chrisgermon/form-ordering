"use server"

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"
import type { ActionPayload } from "@/lib/types"

export async function submitOrder(payload: ActionPayload) {
  const supabase = createClient()
  const { brandSlug, formData } = payload
  console.log("Server Action: Received form data:", formData)

  try {
    // 1. Fetch brand and location details on the server for security
    const { data: brand, error: brandError } = await supabase
      .from("brands")
      .select("id, name")
      .eq("slug", brandSlug)
      .single()
    if (brandError) throw new Error("Brand not found.")

    const { data: billToLocation, error: billToError } = await supabase
      .from("clinic_locations")
      .select("name, address")
      .eq("id", formData.billToId)
      .single()
    if (billToError) throw new Error("Billing location not found.")

    const { data: deliverToLocation, error: deliverToError } = await supabase
      .from("clinic_locations")
      .select("name, address")
      .eq("id", formData.deliverToId)
      .single()
    if (deliverToError) throw new Error("Delivery location not found.")

    // 2. Insert the main submission record
    const { data: submission, error: submissionError } = await supabase
      .from("submissions")
      .insert({
        brand_id: brand.id,
        ordered_by: formData.orderedBy,
        email: formData.email,
        notes: formData.notes,
        billing_address: `${billToLocation.name} - ${billToLocation.address}`,
        delivery_address: `${deliverToLocation.name} - ${deliverToLocation.address}`,
        form_data: formData.items, // Store the raw items object
      })
      .select("id, created_at")
      .single()

    if (submissionError) {
      console.error("Error inserting submission:", submissionError)
      throw new Error("Could not save your order submission.")
    }

    // 3. Generate PDF and send email (implement these functions)
    // const pdfBuffer = await generateOrderPdf({ ... });
    // await sendOrderConfirmationEmail({ ..., pdfAttachment: pdfBuffer });

    revalidatePath(`/forms/${brandSlug}`)
    revalidatePath("/admin")

    return {
      success: true,
      orderNumber: submission.id.toString().substring(0, 8).toUpperCase(),
    }
  } catch (error: any) {
    console.error("Full error in submitOrder:", error)
    return { success: false, error: error.message }
  }
}
