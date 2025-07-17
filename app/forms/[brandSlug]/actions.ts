"use server"

import { createClient } from "@/utils/supabase/server"
import { generatePDF } from "@/lib/pdf"
import { sendOrderEmail } from "@/lib/email"
import type { OrderPayload } from "@/lib/types"

export async function submitOrder(payload: OrderPayload) {
  try {
    const supabase = createClient()

    // Get brand info
    const { data: brand, error: brandError } = await supabase
      .from("brands")
      .select("id, name, emails")
      .eq("slug", payload.brandSlug)
      .single()

    if (brandError || !brand) {
      return { success: false, message: "Brand not found" }
    }

    // Get location info for bill to and deliver to
    const { data: billToLocation, error: billToError } = await supabase
      .from("clinic_locations")
      .select("*")
      .eq("id", payload.orderInfo.billToId)
      .single()

    const { data: deliverToLocation, error: deliverToError } = await supabase
      .from("clinic_locations")
      .select("*")
      .eq("id", payload.orderInfo.deliverToId)
      .single()

    if (billToError || deliverToError || !billToLocation || !deliverToLocation) {
      return { success: false, message: "Invalid location selection" }
    }

    // Generate order number
    const orderNumber = `ORD-${Date.now()}`

    // Save submission to database
    const { data: submission, error: submissionError } = await supabase
      .from("submissions")
      .insert({
        brand_id: brand.id,
        order_number: orderNumber,
        ordered_by: payload.orderInfo.orderedBy,
        email: payload.orderInfo.email,
        bill_to_id: payload.orderInfo.billToId,
        deliver_to_id: payload.orderInfo.deliverToId,
        notes: payload.orderInfo.notes,
        items: payload.items,
        status: "pending",
      })
      .select()
      .single()

    if (submissionError || !submission) {
      console.error("Error saving submission:", submissionError)
      return { success: false, message: "Failed to save order" }
    }

    // Prepare order info for PDF and email
    const orderInfo = {
      orderNumber,
      orderedBy: payload.orderInfo.orderedBy,
      email: payload.orderInfo.email,
      billTo: billToLocation,
      deliverTo: deliverToLocation,
      notes: payload.orderInfo.notes,
    }

    // Get items with details for PDF
    const itemsWithDetails = []
    for (const [itemId, quantity] of Object.entries(payload.items)) {
      if (quantity && quantity !== 0 && quantity !== "") {
        const { data: item } = await supabase.from("items").select("code, name").eq("id", itemId).single()

        if (item) {
          itemsWithDetails.push({
            code: item.code || "",
            name: item.name,
            quantity: quantity,
          })
        }
      }
    }

    // Generate PDF
    const pdfBuffer = await generatePDF(orderInfo, itemsWithDetails)

    // Send email
    await sendOrderEmail(orderInfo, itemsWithDetails, pdfBuffer, brand.emails)

    return {
      success: true,
      message: "Order submitted successfully",
      submissionId: submission.id,
    }
  } catch (error) {
    console.error("Error in submitOrder:", error)
    return {
      success: false,
      message: "An unexpected error occurred",
    }
  }
}
