import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { apiOrderSchema } from "@/lib/schemas"
import { generatePdf } from "@/lib/pdf"
import { sendOrderEmail } from "@/lib/email"
import { put } from "@vercel/blob"
import type { Brand, OrderPayload } from "@/lib/types"
import { resolveAssetUrl } from "@/lib/utils"

export async function POST(request: NextRequest) {
  const supabase = createAdminClient()
  const ip = request.ip ?? "unknown"

  try {
    const body = await request.json()
    const validation = apiOrderSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json({ error: "Invalid order data", details: validation.error.flatten() }, { status: 400 })
    }

    const orderData = validation.data

    // 1. Get brand details
    const { data: brand, error: brandError } = await supabase
      .from("brands")
      .select("*")
      .eq("id", orderData.brandId)
      .single()

    if (brandError || !brand) {
      throw new Error(`Brand with ID ${orderData.brandId} not found.`)
    }

    // Defensive check for clinic locations
    if (!orderData.billTo || !orderData.deliverTo) {
      throw new Error("Billing or delivery location is missing.")
    }

    // 2. Get next order number
    const { data: orderNumberData, error: rpcError } = await supabase.rpc("get_next_order_number", {
      brand_id_param: brand.id,
    })

    if (rpcError) {
      console.error("Error getting next order number:", rpcError)
      throw new Error("Could not generate order number.")
    }
    const orderNumber = orderNumberData

    const payload: OrderPayload = {
      brandId: brand.id,
      orderInfo: {
        orderNumber: orderNumber,
        orderedBy: orderData.orderedBy,
        email: orderData.email,
        billTo: orderData.billTo,
        deliverTo: orderData.deliverTo,
        date: orderData.date,
        notes: orderData.notes,
      },
      items: orderData.items || {},
    }

    // 3. Generate PDF
    const logoUrl = brand.logo ? resolveAssetUrl(brand.logo) : null
    const pdfBuffer = await generatePdf(payload, brand as Brand, logoUrl)

    // 4. Upload PDF to Vercel Blob
    const pdfPath = `orders/${brand.slug}/${orderNumber}.pdf`
    const { url: pdfUrl } = await put(pdfPath, pdfBuffer, {
      access: "public",
      contentType: "application/pdf",
    })

    // 5. Send email
    const emailResult = await sendOrderEmail(payload, brand as Brand, pdfBuffer, logoUrl)

    // 6. Save submission to database
    const { data: submission, error: submissionError } = await supabase
      .from("submissions")
      .insert({
        brand_id: brand.id,
        ordered_by: payload.orderInfo.orderedBy,
        email: payload.orderInfo.email,
        order_data: payload as any, // Store the whole payload
        pdf_url: pdfUrl,
        status: emailResult.success ? "sent" : "failed",
        email_response: emailResult.message,
        ip_address: ip,
        order_number: orderNumber,
      })
      .select()
      .single()

    if (submissionError) {
      console.error("Error saving submission:", submissionError)
      // Don't throw here, as the email might have been sent. Log it.
    }

    if (!emailResult.success) {
      // If email failed, it's still a server-side issue, but we should report it.
      return NextResponse.json(
        {
          error: "Order submitted but failed to send email notification.",
          details: emailResult.message,
          submissionId: submission?.id,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "Order submitted successfully!",
      orderNumber: orderNumber,
      submissionId: submission?.id,
    })
  } catch (error) {
    console.error("Error processing order:", error)
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred."
    return NextResponse.json({ error: "Failed to process order", details: errorMessage }, { status: 500 })
  }
}
