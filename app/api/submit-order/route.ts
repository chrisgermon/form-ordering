import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/utils/supabase/server"
import { sendOrderEmail } from "@/lib/email"
import type { OrderPayload, Brand, ClinicLocation } from "@/lib/types"
import { jsPDF } from "jspdf"
import { put } from "@vercel/blob"

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
    const flatBody = await request.json()

    const supabase = createAdminClient()
    const { data: brand, error: brandError } = await supabase
      .from("brands")
      .select("id, name, emails, logo")
      .eq("id", flatBody.brandId)
      .single()

    if (brandError || !brand) {
      console.error("Error fetching brand for order submission:", brandError)
      return NextResponse.json({ error: "Brand not found" }, { status: 404 })
    }

    let logoUrl: string | null = null
    if (brand.logo) {
      const { data: fileData } = await supabase.from("uploaded_files").select("url").eq("pathname", brand.logo).single()
      if (fileData) {
        logoUrl = fileData.url
      }
    }

    // Generate a more unique order number to prevent filename collisions.
    const uniqueSuffix = Math.random().toString(36).substring(2, 8).toUpperCase()
    const orderNumber = `ORD-${Date.now()}-${uniqueSuffix}`
    const orderPayload: OrderPayload = {
      brandId: flatBody.brandId,
      items: flatBody.items,
      orderInfo: {
        orderNumber: orderNumber,
        orderedBy: flatBody.orderedBy,
        email: flatBody.email,
        billTo: flatBody.billTo,
        deliverTo: flatBody.deliverTo,
        notes: flatBody.notes,
      },
    }

    const pdfArrayBuffer = await generateOrderPdf(orderPayload, brand, logoUrl)
    const pdfBuffer = Buffer.from(pdfArrayBuffer)

    const blob = await put(`orders/order-${orderPayload.orderInfo.orderNumber}.pdf`, pdfBuffer, {
      access: "public",
      contentType: "application/pdf",
      addRandomSuffix: true,
    })

    const emailResult = await sendOrderEmail(orderPayload, brand, pdfBuffer, logoUrl)

    const { error: submissionError } = await supabase.from("submissions").insert({
      brand_id: orderPayload.brandId,
      ordered_by: orderPayload.orderInfo.orderedBy,
      email: orderPayload.orderInfo.email,
      bill_to: orderPayload.orderInfo.billTo.name,
      deliver_to: orderPayload.orderInfo.deliverTo.name,
      items: orderPayload.items as any,
      pdf_url: blob.url,
      status: emailResult.success ? "sent" : "failed",
      email_response: emailResult.message,
      order_data: orderPayload as any,
      ip_address: ip,
    })

    if (submissionError) {
      console.error("Error saving submission to database:", submissionError)
      throw submissionError
    }

    if (!emailResult.success) {
      throw new Error(emailResult.message)
    }

    return NextResponse.json({ success: true, message: "Order processed successfully." })
  } catch (error) {
    console.error("Error processing order:", error)
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json({ error: "Failed to process order", details: errorMessage }, { status: 500 })
  }
}
