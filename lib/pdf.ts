import PDFDocument from "pdfkit"
import type { OrderInfoForPdf, OrderItem } from "./types"

export async function generatePDF(orderInfo: OrderInfoForPdf, items: OrderItem[]): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 })
      const chunks: Buffer[] = []

      doc.on("data", (chunk) => chunks.push(chunk))
      doc.on("end", () => resolve(Buffer.concat(chunks)))
      doc.on("error", reject)

      // Header
      doc.fontSize(20).text("Order Form", { align: "center" })
      doc.moveDown()

      // Order details
      doc.fontSize(14).text(`Order Number: ${orderInfo.orderNumber}`)
      doc.text(`Ordered By: ${orderInfo.orderedBy}`)
      doc.text(`Email: ${orderInfo.email}`)
      doc.text(`Date: ${new Date().toLocaleDateString()}`)
      doc.moveDown()

      // Billing and delivery info
      doc.text("Bill To:")
      doc.fontSize(12)
      doc.text(`${orderInfo.billTo.name}`)
      doc.text(`${orderInfo.billTo.address}`)
      doc.moveDown()

      doc.fontSize(14).text("Deliver To:")
      doc.fontSize(12)
      doc.text(`${orderInfo.deliverTo.name}`)
      doc.text(`${orderInfo.deliverTo.address}`)
      doc.moveDown()

      // Items
      if (items.length > 0) {
        doc.fontSize(14).text("Items:")
        doc.moveDown(0.5)

        items.forEach((item) => {
          doc.fontSize(12)
          doc.text(`${item.code ? `${item.code} - ` : ""}${item.name}: ${item.quantity}`)
        })
        doc.moveDown()
      }

      // Notes
      if (orderInfo.notes) {
        doc.fontSize(14).text("Notes:")
        doc.fontSize(12).text(orderInfo.notes)
      }

      doc.end()
    } catch (error) {
      reject(error)
    }
  })
}
