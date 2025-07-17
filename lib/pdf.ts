import type { OrderInfoForPdf, OrderItem } from "./types"

export async function generatePDF(orderInfo: OrderInfoForPdf, items: OrderItem[]): Promise<Buffer> {
  console.log("=== GENERATING PDF ===")
  console.log("Order info:", orderInfo)
  console.log("Items:", items)

  try {
    // Create a simple text-based PDF content
    const pdfContent = `
ORDER FORM

Order Number: ${String(orderInfo.orderNumber || "")}
Ordered By: ${String(orderInfo.orderedBy || "")}
Email: ${String(orderInfo.email || "")}
Date: ${new Date().toLocaleDateString()}

BILLING INFORMATION:
${String(orderInfo.billTo?.name || "")}
${String(orderInfo.billTo?.address || "")}

DELIVERY INFORMATION:
${String(orderInfo.deliverTo?.name || "")}
${String(orderInfo.deliverTo?.address || "")}

ITEMS:
${items
  .map((item) => `- ${String(item.name || "")} (${String(item.code || "")}) - Qty: ${String(item.quantity || 1)}`)
  .join("\n")}

NOTES:
${String(orderInfo.notes || "None")}

Generated on: ${new Date().toISOString()}
    `.trim()

    console.log("PDF content created")

    // For now, return the content as a buffer
    // In production, you'd use a proper PDF library
    const buffer = Buffer.from(pdfContent, "utf-8")

    return buffer
  } catch (error) {
    console.error("PDF generation error:", error)
    throw new Error(`Failed to generate PDF: ${String(error)}`)
  }
}
