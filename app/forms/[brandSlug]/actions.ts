"use server"

import { createClient } from "@/utils/supabase/server"
import { generatePDF } from "@/lib/pdf"
import { sendOrderEmail } from "@/lib/email"

interface OrderPayload {
  brandSlug: string
  orderInfo: {
    orderedBy: string
    email: string
    billToId: string
    deliverToId: string
    notes?: string
  }
  items: Record<string, string | number | boolean>
}

export async function submitOrder(payload: OrderPayload) {
  console.log("=== SUBMIT ORDER ACTION ===")
  console.log("Payload:", payload)

  const supabase = createClient()

  try {
    // Get brand
    const { data: brand, error: brandError } = await supabase
      .from("brands")
      .select("*")
      .eq("slug", payload.brandSlug)
      .single()

    if (brandError || !brand) {
      console.error("Brand not found:", brandError)
      return { success: false, error: "Brand not found" }
    }

    // Get locations
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
      console.error("Location not found:", { billToError, deliverToError })
      return { success: false, error: "Location not found" }
    }

    // Generate order number
    const orderNumber = `ORD-${Date.now()}`

    // Create submission record
    const { data: submission, error: submissionError } = await supabase
      .from("form_submissions")
      .insert({
        brand_id: brand.id,
        order_number: orderNumber,
        ordered_by: payload.orderInfo.orderedBy,
        email: payload.orderInfo.email,
        deliver_to_id: payload.orderInfo.deliverToId,
        bill_to_id: payload.orderInfo.billToId,
        notes: payload.orderInfo.notes || null,
        items: JSON.stringify(payload.items),
        status: "pending",
      })
      .select()
      .single()

    if (submissionError || !submission) {
      console.error("Failed to create submission:", submissionError)
      return { success: false, error: "Failed to create order" }
    }

    // Generate PDF
    const orderData = {
      orderNumber,
      orderedBy: payload.orderInfo.orderedBy,
      email: payload.orderInfo.email,
      billTo: {
        name: billToLocation.name,
        address: billToLocation.address,
      },
      deliverTo: {
        name: deliverToLocation.name,
        address: deliverToLocation.address,
      },
      notes: payload.orderInfo.notes || "",
    }

    const orderItems = Object.entries(payload.items)
      .filter(([_, value]) => value && value !== "" && value !== false)
      .map(([itemId, quantity]) => ({
        id: itemId,
        name: `Item ${itemId}`,
        code: itemId,
        quantity: typeof quantity === "number" ? quantity : 1,
      }))

    console.log("Generating PDF with:", { orderData, orderItems })

    try {
      const pdfBuffer = await generatePDF(orderData, orderItems)
      await sendOrderEmail(payload.orderInfo.email, orderNumber, brand.name, pdfBuffer)
      console.log("PDF and email sent successfully")
    } catch (error) {
      console.error("PDF/Email error:", error)
      // Don't fail the entire submission for this
    }

    console.log("Order submitted successfully:", submission.id)

    return { success: true, submissionId: submission.id, orderNumber }
  } catch (error) {
    console.error("Submit order error:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}
