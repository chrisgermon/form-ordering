import { jsPDF } from "jspdf"
import type { OrderPayload, Brand, ClinicLocation } from "@/lib/types"

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

export async function generatePdf(order: OrderPayload, brand: Brand, logoUrl: string | null): Promise<Buffer> {
  const doc = new jsPDF()
  const { orderInfo, items } = order
  let yPos = 20

  if (logoUrl) {
    try {
      const logoResponse = await fetch(logoUrl)
      if (logoResponse.ok) {
        const logoBuffer = await logoResponse.arrayBuffer()
        const logoExtension = logoUrl.split(".").pop()?.toUpperCase() || "PNG"
        doc.addImage(Buffer.from(logoBuffer), logoExtension, 15, 15, 50, 20) // x, y, w, h
        yPos = 45 // Move down to make space for logo
      } else {
        console.error(`Failed to fetch logo: ${logoResponse.status} ${logoResponse.statusText}`)
        yPos = 20 // Fallback position
      }
    } catch (e) {
      console.error("Error fetching or adding logo to PDF:", e)
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

  const pdfArrayBuffer = doc.output("arraybuffer")
  return Buffer.from(pdfArrayBuffer)
}
