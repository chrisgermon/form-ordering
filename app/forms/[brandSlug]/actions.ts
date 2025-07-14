"use server"

import { createClient } from "@/utils/supabase/server"
import { z } from "zod"
import { sendOrderEmail } from "@/lib/email"
import { generatePdf } from "@/lib/pdf"
import type { BrandData, ClinicLocation, Item, OrderItem } from "@/lib/types"

const orderPayloadSchema = z.object({
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

export async function submitOrder(payload: z.infer<typeof orderPayloadSchema>) {
  const validation = orderPayloadSchema.safeParse(payload)
  if (!validation.success) {
    console.error("Invalid submission payload:", validation.error.flatten())
    return { success: false, message: "Invalid data provided. Please check the form and try again." }
  }

  const { brandSlug, orderInfo, items } = validation.data
  const supabase = createClient()

  try {
    const { data: brandData, error: brandError } = await supabase
      .from("brands")
      .select("*, clinic_locations(*), sections(*, items(*, options(*)))")
      .eq("slug", brandSlug)
      .single<BrandData>()

    if (brandError || !brandData) {
      console.error("Error fetching brand details:", brandError)
      return { success: false, message: "Could not find brand information." }
    }

    const billTo = brandData.clinic_locations.find((loc: ClinicLocation) => loc.id === orderInfo.billToId)
    const deliverTo = brandData.clinic_locations.find((loc: ClinicLocation) => loc.id === orderInfo.deliverToId)

    if (!billTo || !deliverTo) {
      return { success: false, message: "Invalid billing or delivery location selected." }
    }

    const allItems: Item[] = brandData.sections.flatMap((s) => s.items)
    const submittedItems: OrderItem[] = Object.entries(items)
      .map(([itemId, value]) => {
        if (!value || (typeof value === "boolean" && !value)) return null
        const itemDetails = allItems.find((i) => i.id === itemId)
        if (!itemDetails) return null
        return {
          code: itemDetails.code,
          name: itemDetails.name,
          quantity: value === true ? "Yes" : String(value),
        }
      })
      .filter((item): item is OrderItem => item !== null)

    if (submittedItems.length === 0) {
      return { success: false, message: "You must select at least one item to order." }
    }

    const { data: submission, error: submissionError } = await supabase
      .from("submissions")
      .insert({
        brand_id: brandData.id,
        ordered_by: orderInfo.orderedBy,
        email: orderInfo.email,
        bill_to: billTo.id,
        deliver_to: deliverTo.id,
        notes: orderInfo.notes,
        items: submittedItems,
      })
      .select("id")
      .single()

    if (submissionError) {
      console.error("Error saving submission:", submissionError)
      return { success: false, message: "A database error occurred while saving your order." }
    }

    const fullOrderInfo = { ...orderInfo, billTo, deliverTo, orderNumber: submission.id.toString() }

    const pdfBuffer = await generatePdf({
      brand: brandData,
      orderInfo: fullOrderInfo,
      items: submittedItems,
    })

    await sendOrderEmail({
      to: [orderInfo.email, ...brandData.emails],
      subject: `New Order Confirmation for ${brandData.name} - #${submission.id}`,
      brand: brandData,
      orderInfo: fullOrderInfo,
      items: submittedItems,
      attachments: [
        {
          filename: `order-${brandData.slug}-${submission.id}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    })

    return { success: true, submissionId: submission.id }
  } catch (error) {
    console.error("An unexpected error occurred during order submission:", error)
    return { success: false, message: "An unexpected server error occurred. Please try again later." }
  }
}
