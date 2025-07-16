"use server"

import { createClient } from "@/utils/supabase/server"
import { z } from "zod"
import { generateOrderPdf } from "@/lib/pdf"
import { sendOrderConfirmationEmail } from "@/lib/email"
import type { ClinicLocation, Item } from "@/lib/types"

const formSchema = z.object({
  brandSlug: z.string(),
  orderInfo: z.object({
    orderedBy: z.string(),
    email: z.string().email(),
    billToId: z.string(),
    deliverToId: z.string(),
    notes: z.string().optional(),
  }),
  items: z.record(z.any()),
})

export async function submitOrder(payload: z.infer<typeof formSchema>) {
  const validation = formSchema.safeParse(payload)
  if (!validation.success) {
    return { success: false, message: "Invalid form data." }
  }

  const { brandSlug, orderInfo, items: submittedItems } = validation.data
  const supabase = createClient()

  try {
    // 1. Fetch brand, locations, and all possible items for this brand
    const { data: brand, error: brandError } = await supabase
      .from("brands")
      .select("*, clinic_locations(*), sections(items(*))")
      .eq("slug", brandSlug)
      .single()

    if (brandError || !brand) {
      console.error("Submission Error: Brand not found", brandError)
      return { success: false, message: "Brand not found." }
    }

    const billTo = brand.clinic_locations.find((loc: ClinicLocation) => loc.id === orderInfo.billToId)
    const deliverTo = brand.clinic_locations.find((loc: ClinicLocation) => loc.id === orderInfo.deliverToId)

    if (!billTo || !deliverTo) {
      return { success: false, message: "Invalid billing or delivery location." }
    }

    // 2. Filter and format submitted items
    const allItems: Item[] = brand.sections.flatMap((s: any) => s.items)
    const orderItems = Object.entries(submittedItems)
      .map(([itemId, value]) => {
        if (!value || (typeof value === "string" && value.trim() === "")) return null
        const itemDetails = allItems.find((i) => i.id === itemId)
        if (!itemDetails) return null
        return {
          code: itemDetails.code,
          name: itemDetails.name,
          quantity: value,
        }
      })
      .filter(Boolean) as { code: string; name: string; quantity: string | number }[]

    if (orderItems.length === 0) {
      return { success: false, message: "Your order is empty. Please specify a quantity for at least one item." }
    }

    // 3. Create submission record
    const { data: submission, error: submissionError } = await supabase
      .from("submissions")
      .insert({
        brand_id: brand.id,
        ordered_by: orderInfo.orderedBy,
        email: orderInfo.email,
        bill_to: billTo.id, // CRITICAL FIX: Ensure we use the location ID
        deliver_to: deliverTo.id, // CRITICAL FIX: Ensure we use the location ID
        notes: orderInfo.notes,
        items: orderItems,
      })
      .select("id")
      .single()

    if (submissionError || !submission) {
      console.error("Submission Error: Failed to save submission", submissionError)
      const dbErrorMessage = submissionError?.message || "Failed to save your order."
      return { success: false, message: `Database error: ${dbErrorMessage}` }
    }

    // 4. Generate PDF
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

    // 5. Send email
    await sendOrderConfirmationEmail({
      to: [orderInfo.email, ...brand.emails],
      brand: brand, // Pass the full brand object
      orderId: submission.id,
      pdfBuffer,
    })

    return { success: true, submissionId: submission.id }
  } catch (error) {
    console.error("Unexpected Submission Error:", error)
    const message = error instanceof Error ? error.message : "An unknown error occurred during submission."
    return { success: false, message }
  }
}
