"use server"

import { createClient } from "@/utils/supabase/server"
import { generateOrderPdf } from "@/lib/pdf"
import { sendOrderConfirmationEmail } from "@/lib/email"
import type { ClinicLocation, OrderPayload, Brand } from "@/lib/types"

export async function submitOrder(payload: OrderPayload) {
  const { brandSlug, orderInfo, items: submittedItems } = payload
  const supabase = createClient()

  try {
    // Step 1: Fetch the brand and all its locations directly.
    const { data: brand, error: brandError } = await supabase
      .from("brands")
      .select("*")
      .eq("slug", brandSlug)
      .single<Brand>()

    if (brandError || !brand) {
      console.error("Submission Error: Brand not found", brandError)
      return { success: false, message: "Brand not found." }
    }

    const { data: allLocations, error: locationsError } = await supabase
      .from("clinic_locations")
      .select("*")
      .eq("brand_id", brand.id)

    if (locationsError) {
      console.error("Submission Error: Could not fetch locations", locationsError)
      return { success: false, message: "Could not verify locations." }
    }

    const billTo = allLocations.find((loc: ClinicLocation) => loc.id === orderInfo.billToId)
    const deliverTo = allLocations.find((loc: ClinicLocation) => loc.id === orderInfo.deliverToId)

    if (!billTo || !deliverTo) {
      return { success: false, message: "Invalid billing or delivery location." }
    }

    // Step 2: Fetch all possible items for the brand to validate against.
    const { data: allItems, error: itemsError } = await supabase
      .from("items")
      .select("id, code, name")
      .eq("brand_id", brand.id)

    if (itemsError) {
      console.error("Submission Error: Could not fetch items", itemsError)
      return { success: false, message: "Could not verify items." }
    }

    // Step 3: Filter and format submitted items.
    const orderItems = Object.entries(submittedItems)
      .map(([itemId, value]) => {
        if (
          value === false ||
          value === null ||
          value === undefined ||
          (typeof value === "string" && value.trim() === "")
        ) {
          return null
        }
        const itemDetails = allItems.find((i) => i.id === itemId)
        if (!itemDetails) return null
        return {
          code: itemDetails.code,
          name: itemDetails.name,
          quantity: value === true ? 1 : value,
        }
      })
      .filter(Boolean) as { code: string; name: string; quantity: string | number }[]

    if (orderItems.length === 0) {
      return { success: false, message: "Your order is empty. Please specify a quantity for at least one item." }
    }

    // Step 4: Create the submission record.
    const { data: submission, error: submissionError } = await supabase
      .from("submissions")
      .insert({
        brand_id: brand.id,
        ordered_by: orderInfo.orderedBy,
        email: orderInfo.email,
        bill_to: billTo.id,
        deliver_to: deliverTo.id,
        notes: orderInfo.notes,
        items: orderItems,
      })
      .select("id")
      .single()

    if (submissionError || !submission) {
      console.error("Submission Error: Failed to save submission", submissionError)
      return { success: false, message: `Database error: ${submissionError?.message}` }
    }

    // Step 5: Generate PDF and send email.
    const pdfBuffer = await generateOrderPdf({
      orderInfo: {
        orderNumber: submission.id,
        orderedBy: orderInfo.orderedBy,
        email: orderInfo.email,
        billTo,
        deliverTo,
        notes: orderInfo.notes,
      },
      items: orderItems,
      brand,
    })

    await sendOrderConfirmationEmail({
      to: [orderInfo.email, ...brand.emails],
      brand: brand,
      orderId: submission.id,
      pdfBuffer,
    })

    return { success: true, submissionId: submission.id }
  } catch (error) {
    console.error("Unexpected Submission Error:", error)
    const message = error instanceof Error ? error.message : "An unexpected error occurred."
    return { success: false, message }
  }
}
