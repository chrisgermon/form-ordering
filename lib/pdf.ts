import { jsPDF } from "jspdf"
import type { OrderInfoForPdf, OrderItem } from "./types"

export async function generatePDF(orderInfo: OrderInfoForPdf, items: OrderItem[]): Promise<Buffer> {
  console.log("=== GENERATING PDF ===")
  console.log("Order info:", orderInfo)
  console.log("Items:", items)

  try {
    const doc = new jsPDF()

    // Header
    doc.setFontSize(20)
    doc.text("Order Form", 20, 30)

    // Order details
    doc.setFontSize(12)
    let yPosition = 50

    doc.text(`Order Number: ${String(orderInfo.orderNumber || "")}`, 20, yPosition)
    yPosition += 10

    doc.text(`Ordered By: ${String(orderInfo.orderedBy || "")}`, 20, yPosition)
    yPosition += 10

    doc.text(`Email: ${String(orderInfo.email || "")}`, 20, yPosition)
    yPosition += 10

    doc.text(
      `Bill To: ${String(orderInfo.billTo?.name || "")} - ${String(orderInfo.billTo?.address || "")}`,
      20,
      yPosition,
    )
    yPosition += 10

    doc.text(
      `Deliver To: ${String(orderInfo.deliverTo?.name || "")} - ${String(orderInfo.deliverTo?.address || "")}`,
      20,
      yPosition,
    )
    yPosition += 20

    if (orderInfo.notes) {
      doc.text(`Notes: ${String(orderInfo.notes)}`, 20, yPosition)
      yPosition += 20
    }

    // Items
    doc.setFontSize(14)
    doc.text("Items:", 20, yPosition)
    yPosition += 10

    doc.setFontSize(10)
    items.forEach((item) => {
      const itemName = String(item.name || "Unknown Item")
      const itemCode = String(item.code || "")
      const itemQuantity = String(item.quantity || 1)

      doc.text(`• ${itemName} (${itemCode}) - Qty: ${itemQuantity}`, 25, yPosition)
      yPosition += 8
    })

    // Footer
    yPosition += 20
    doc.setFontSize(8)
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, yPosition)

    console.log("PDF generated successfully")

    // Convert to buffer
    const pdfArrayBuffer = doc.output("arraybuffer")
    const pdfBuffer = Buffer.from(pdfArrayBuffer)

    return pdfBuffer
  } catch (error) {
    console.error("PDF generation error:", error)
    throw new Error(`Failed to generate PDF: ${String(error)}`)
  }
}
