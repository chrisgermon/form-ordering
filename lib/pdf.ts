import { PDFDocument, rgb, StandardFonts } from "pdf-lib"
import type { OrderInfoForPdf, PdfOrderItem } from "./types"

interface PdfData {
  orderNumber: string
  orderDate: string
  brandName: string
  orderedBy: string
  email: string
  billingAddress: string
  deliveryAddress: string
  notes?: string
  items: { name: string; quantity: string | number | boolean }[]
}

export async function generatePdf(orderInfo: OrderInfoForPdf, items: PdfOrderItem[]): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage()
  const { width, height } = page.getSize()
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  let y = height - 50

  // Header
  page.drawText("Order Confirmation", {
    x: 50,
    y,
    font: boldFont,
    size: 24,
  })
  y -= 50

  // Order Info
  page.drawText(`Order Number: ${orderInfo.orderNumber}`, { x: 50, y, font, size: 12 })
  y -= 20
  page.drawText(`Ordered By: ${orderInfo.orderedBy}`, { x: 50, y, font, size: 12 })
  y -= 20
  page.drawText(`Email: ${orderInfo.email}`, { x: 50, y, font, size: 12 })
  y -= 40

  // Billing and Delivery
  page.drawText("Bill To:", { x: 50, y, font: boldFont, size: 14 })
  page.drawText("Deliver To:", { x: 300, y, font: boldFont, size: 14 })
  y -= 20
  page.drawText(orderInfo.billTo.name, { x: 50, y, font, size: 12 })
  page.drawText(orderInfo.deliverTo.name, { x: 300, y, font, size: 12 })
  y -= 15
  const billToAddress = orderInfo.billTo.address.split("\n")
  const deliverToAddress = orderInfo.deliverTo.address.split("\n")
  billToAddress.forEach((line) => {
    page.drawText(line, { x: 50, y, font, size: 12 })
    y -= 15
  })
  y += 15 * billToAddress.length // Reset y for the other column
  deliverToAddress.forEach((line) => {
    page.drawText(line, { x: 300, y, font, size: 12 })
    y -= 15
  })

  y -= 25 // Extra space before items table

  // Items Table Header
  page.drawText("Item Code", { x: 50, y, font: boldFont, size: 12 })
  page.drawText("Item Name", { x: 150, y, font: boldFont, size: 12 })
  page.drawText("Quantity", { x: 450, y, font: boldFont, size: 12 })
  y -= 5
  page.drawLine({
    start: { x: 50, y },
    end: { x: width - 50, y },
    thickness: 1,
    color: rgb(0, 0, 0),
  })
  y -= 20

  // Items Table Rows
  items.forEach((item) => {
    if (y < 50) {
      // Add new page if content is overflowing
      const newPage = pdfDoc.addPage()
      y = newPage.getSize().height - 50
    }
    page.drawText(String(item.code || "N/A"), { x: 50, y, font, size: 12 })
    page.drawText(String(item.name), { x: 150, y, font, size: 12 })
    page.drawText(String(item.quantity), { x: 450, y, font, size: 12 })
    y -= 20
  })

  // Notes
  if (orderInfo.notes) {
    y -= 20
    page.drawText("Notes:", { x: 50, y, font: boldFont, size: 14 })
    y -= 20
    page.drawText(orderInfo.notes, { x: 50, y, font, size: 12, maxWidth: width - 100, lineHeight: 15 })
  }

  const pdfBytes = await pdfDoc.save()
  return Buffer.from(pdfBytes)
}

export async function generateOrderPdf(data: PdfData): Promise<Buffer> {
  console.log("Generating PDF for order:", data.orderNumber)
  // In a real app, you would use a library to create a PDF here.
  // For now, we'll return a dummy buffer.
  const dummyPdfContent = `
    Order Confirmation: ${data.orderNumber}
    Date: ${data.orderDate}
    Brand: ${data.brandName}
    Ordered By: ${data.orderedBy}
    Email: ${data.email}
    
    Billing: ${data.billingAddress}
    Delivery: ${data.deliveryAddress}
    
    Notes: ${data.notes || "N/A"}
    
    Items:
    ${data.items.map((item) => `- ${item.name}: ${item.quantity}`).join("\n")}
  `
  return Buffer.from(dummyPdfContent)
}
