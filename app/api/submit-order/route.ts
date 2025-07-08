import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { sendOrderEmail } from "@/lib/email"
import type { OrderPayload, Brand, ClinicLocation, OrderData } from "@/lib/types"
import { jsPDF } from "jspdf"

function addClinicInfo(doc: jsPDF, yPos: number, title: string, clinic: ClinicLocation | null) {
  if (!clinic) return yPos
  doc.text(`${title}: ${clinic.name}`, 105, yPos)
  yPos += 7
  if (clinic.address) {
    const addressLines = doc.splitTextToSize(`Address: ${clinic.address}`, 90)
    doc.text(addressLines, 105, yPos)
    yPos += addressLines.length * 5
  }
  if (clinic.phone) {
    doc.text(`Phone: ${clinic.phone}`, 105, yPos)
    yPos += 7
  }
  return yPos
}

async function generateOrderPdf(order: OrderPayload, brand: Brand, logoUrl: string | null): Promise<ArrayBuffer> {
  const doc = new jsPDF()
  const { orderInfo, items } = order
  let yPos = 20

  if (logoUrl) {
    try {
      const logoResponse = await fetch(logoUrl)
      const logoBuffer = await logoResponse.arrayBuffer()
      const logoExtension = logoUrl.split(".").pop()?.toUpperCase() || "PNG"
      doc.addImage(Buffer.from(logoBuffer), logoExtension, 15, 15, 50, 20) // x, y, w, h
      yPos = 45 // Move down to make space for logo
    } catch (e) {
      console.error("Failed to fetch or add logo to PDF:", e)
      yPos = 20 // Fallback position
    }
  }

  doc.setFontSize(22)
  doc.text(brand.name, 105, yPos, { align: "center" })
  yPos += 10
  doc.setFontSize(16)
  doc.text("Printing Order Form", 105, yPos, { align: "center" })
  yPos += 15

  doc.setFontSize(12)
  doc.text(`Order Number: ${orderInfo.orderNumber}`, 15, yPos)
  doc.text(`Date: ${new Date().toLocaleDateString("en-AU")}`, 140, yPos)
  yPos += 5

  doc.line(15, yPos, 195, yPos) // horizontal line
  yPos += 10

  const leftColumnY = yPos
  doc.text(`Ordered By: ${orderInfo.orderedBy}`, 15, leftColumnY)
  doc.text(`Email: ${orderInfo.email}`, 15, leftColumnY + 7)

  let rightColumnY = yPos
  rightColumnY = addClinicInfo(doc, rightColumnY, "Bill To", orderInfo.billTo)
  rightColumnY = addClinicInfo(doc, rightColumnY, "Deliver To", orderInfo.deliverTo)

  yPos = Math.max(leftColumnY + 14, rightColumnY) + 5

  doc.line(15, yPos - 5, 195, yPos - 5)
  doc.setFont("helvetica", "bold")
  doc.text("Code", 15, yPos)
  doc.text("Item Name", 50, yPos)
  doc.text("Quantity", 180, yPos, { align: "right" })
  doc.setFont("helvetica", "normal")
  yPos += 2
  doc.line(15, yPos, 195, yPos)
  yPos += 8

  Object.values(items || {}).forEach((item: any) => {
    if (yPos > 270) {
      doc.addPage()
      yPos = 20
    }
    const quantity = item.quantity === "other" ? `${item.customQuantity} (custom)` : item.quantity
    doc.text(item.code, 15, yPos)
    doc.text(item.name, 50, yPos)
    doc.text(quantity.toString(), 180, yPos, { align: "right" })
    yPos += 7
  })

  if (orderInfo.notes) {
    yPos += 10
    doc.line(15, yPos - 5, 195, yPos - 5)
    doc.setFont("helvetica", "bold")
    doc.text("Notes:", 15, yPos)
    doc.setFont("helvetica", "normal")
    yPos += 7
    const notes = doc.splitTextToSize(orderInfo.notes, 180)
    doc.text(notes, 15, yPos)
  }

  return doc.output("arraybuffer")
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.ip ?? request.headers.get("x-forwarded-for") ?? "Unknown"
    const orderData: OrderData = await request.json()
    const { brand_id, ordered_by, email, orderInfo } = orderData

    if (!brand_id || !ordered_by || !email) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = createAdminClient()

    // 1. Get the next order number
    const { data: orderNumberData, error: orderNumberError } = await supabase.rpc("get_next_order_number", {
      brand_id_param: brand_id,
    })

    if (orderNumberError) {
      console.error("Error getting next order number:", orderNumberError)
      return NextResponse.json({ error: "Could not generate order number." }, { status: 500 })
    }
    const orderNumber = orderNumberData

    // Add order number to order data
    const finalOrderData = {
      ...orderData,
      orderInfo: {
        ...orderInfo,
        orderNumber: orderNumber,
      },
    }

    // 2. Save submission to the database
    const { data: submission, error: submissionError } = await supabase
      .from("submissions")
      .insert({
        brand_id: brand_id,
        ordered_by: ordered_by,
        email: email,
        order_data: finalOrderData,
        status: "pending", // We'll update this after sending the email
        ip_address: ip,
        order_number: orderNumber, // Add order number here
      })
      .select()
      .single()

    if (submissionError) {
      console.error("Error saving submission to database:", submissionError)
      return NextResponse.json({ error: "Could not save submission." }, { status: 500 })
    }

    // 3. Send email
    try {
      const emailResponse = await sendOrderEmail(finalOrderData)

      // 4. Update submission status to 'sent'
      await supabase
        .from("submissions")
        .update({ status: "sent", email_response: JSON.stringify(emailResponse) })
        .eq("id", submission.id)

      return NextResponse.json({ success: true, orderNumber: orderNumber })
    } catch (emailError: any) {
      console.error("Error sending email:", emailError)

      // 4b. Update submission status to 'failed'
      await supabase
        .from("submissions")
        .update({ status: "failed", email_response: emailError.message })
        .eq("id", submission.id)

      return NextResponse.json({ error: "Could not send email." }, { status: 500 })
    }
  } catch (error) {
    console.error("Error processing order:", error)
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json({ error: "Failed to process order", details: errorMessage }, { status: 500 })
  }
}
