"use server"

import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { generateOrderPdf } from "@/lib/pdf"
import { sendOrderEmail } from "@/lib/email"
import type { Brand, ClinicLocation, OrderInfo, OrderItem } from "@/lib/types"

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
      return { error: "Please fill in all required fields" }
    }

    // Get brand from the current URL (we'll need to pass this somehow)
    // For now, let's get it from the first location
    const { data: deliverToLocation } = await supabase
      .from("clinic_locations")
      .select("*, brands(*)")
      .eq("id", deliverToId)
      .single()

    if (!deliverToLocation) {
      return { error: "Invalid delivery location" }
    }

    const brand = deliverToLocation.brands as Brand

    // Get locations
    const { data: billToLocation } = await supabase.from("clinic_locations").select("*").eq("id", billToId).single()

    if (!billToLocation) {
      return { error: "Invalid billing location" }
    }

    // Extract quantities and create order items
    const items: OrderItem[] = []

    // Get all form items for this brand
    const { data: formItems } = await supabase
      .from("form_items")
      .select("*, form_sections!inner(brand_id)")
      .eq("form_sections.brand_id", brand.id)

    if (formItems) {
      for (const item of formItems) {
        const quantityKey = `quantity-${item.id}`
        const quantity = Number.parseInt(formData.get(quantityKey) as string) || 0

        if (quantity > 0) {
          items.push({
            id: item.id,
            name: item.name,
            code: item.code,
            quantity,
          })
        }
      }
    }

    if (items.length === 0) {
      return { error: "Please select at least one item with a quantity greater than 0" }
    }

    // Generate order number
    const orderNumber = `ORD-${Date.now()}`

    // Create order info
    const orderInfo: OrderInfo = {
      orderNumber,
      orderedBy,
      email,
      deliverTo: deliverToLocation as ClinicLocation,
      billTo: billToLocation as ClinicLocation,
      notes: notes || undefined,
    }

    // Save to database
    const { data: submission, error: saveError } = await supabase
      .from("form_submissions")
      .insert({
        brand_id: brand.id,
        order_number: orderNumber,
        ordered_by: orderedBy,
        email,
        deliver_to_id: deliverToId,
        bill_to_id: billToId,
        notes: notes || null,
        items: items,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (saveError) {
      console.error("Error saving submission:", saveError)
      return { error: "Failed to save order. Please try again." }
    }

    // Generate PDF
    try {
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
    } catch (error) {
      console.error("Error generating PDF or sending email:", error)
      // Don't fail the entire submission if PDF/email fails
    }

    // Redirect to success page
    redirect(`/forms/${brand.slug}/success?orderNumber=${orderNumber}`)
  } catch (error) {
    console.error("Error submitting order:", error)
    return { error: "An unexpected error occurred. Please try again." }
  }
}
