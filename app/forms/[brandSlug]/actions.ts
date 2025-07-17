"use server"

import { createClient } from "@/utils/supabase/server"
import { generateOrderPdf } from "@/lib/pdf"
import { sendOrderEmail } from "@/lib/email"
import type { OrderInfo, OrderItem } from "@/lib/types"

export async function submitOrder(prevState: any, formData: FormData) {
  try {
    const supabase = createClient()

    // Extract form data
    const orderedBy = formData.get("orderedBy") as string
    const email = formData.get("email") as string
    const deliverToId = formData.get("deliverTo") as string
    const billToId = formData.get("billTo") as string
    const notes = formData.get("notes") as string

    if (!orderedBy || !email || !deliverToId || !billToId) {
      return { error: "Please fill in all required fields." }
    }

    // Get brand from URL (we need to extract this from the form or pass it)
    const brandSlug = formData.get("brandSlug") as string
    if (!brandSlug) {
      return { error: "Brand information is missing." }
    }

    // Fetch brand
    const { data: brand, error: brandError } = await supabase.from("brands").select("*").eq("slug", brandSlug).single()

    if (brandError || !brand) {
      return { error: "Brand not found." }
    }

    // Fetch locations
    const { data: deliverTo, error: deliverError } = await supabase
      .from("clinic_locations")
      .select("*")
      .eq("id", deliverToId)
      .single()

    const { data: billTo, error: billError } = await supabase
      .from("clinic_locations")
      .select("*")
      .eq("id", billToId)
      .single()

    if (deliverError || billError || !deliverTo || !billTo) {
      return { error: "Selected locations not found." }
    }

    // Generate order number
    const orderNumber = `ORD-${Date.now()}`

    // Collect ordered items
    const items: OrderItem[] = []
    const allFormData = Array.from(formData.entries())

    for (const [key, value] of allFormData) {
      if (key.startsWith("quantity-") && value && Number(value) > 0) {
        const itemId = key.replace("quantity-", "")

        // Fetch item details
        const { data: item } = await supabase.from("form_items").select("*").eq("id", itemId).single()

        if (item) {
          items.push({
            id: item.id,
            name: item.name,
            code: item.code,
            quantity: Number(value),
          })
        }
      }
    }

    if (items.length === 0) {
      return { error: "Please select at least one item with a quantity greater than 0." }
    }

    // Create order info
    const orderInfo: OrderInfo = {
      orderNumber,
      orderedBy,
      email,
      deliverTo,
      billTo,
      notes: notes || undefined,
    }

    // Generate PDF
    const pdfBuffer = await generateOrderPdf({
      orderInfo,
      items,
      brand,
    })

    // Send email
    await sendOrderEmail({
      orderInfo,
      items,
      brand,
      pdfBuffer,
    })

    // Save submission to database
    const { data: submission, error: submissionError } = await supabase
      .from("form_submissions")
      .insert({
        brand_id: brand.id,
        order_number: orderNumber,
        ordered_by: orderedBy,
        email,
        deliver_to_id: deliverToId,
        bill_to_id: billToId,
        notes,
        items: JSON.stringify(items),
        status: "submitted",
      })
      .select()
      .single()

    if (submissionError) {
      console.error("Error saving submission:", submissionError)
      // Don't fail the whole process if we can't save to DB
    }

    return {
      success: true,
      message: "Order submitted successfully!",
      submissionId: submission?.id || orderNumber,
    }
  } catch (error) {
    console.error("Error submitting order:", error)
    return { error: "An error occurred while submitting your order. Please try again." }
  }
}
