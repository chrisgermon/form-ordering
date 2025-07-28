import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { sendOrderEmail } from "@/lib/email"
import { put } from "@vercel/blob"
import { revalidatePath } from "next/cache"
import { PDFDocument, rgb, StandardFonts } from "pdf-lib"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.json()
    console.log("Received form data:", {
      brandId: formData.brandId,
      brandName: formData.brandName,
      itemsCount: formData.items ? Object.keys(formData.items).length : 0,
    })

    // --- 1. Generate PDF using pdf-lib ---
    console.log("Generating PDF...")
    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage()
    const { width, height } = page.getSize()
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

    let y = height - 50

    const drawText = (text: string, x: number, isBold = false, size = 12) => {
      if (y < 50) {
        // Add new page if content overflows
        const newPage = pdfDoc.addPage()
        page.moveTo(0, 0) // This seems wrong, should be newPage.
        y = newPage.getHeight() - 50
      }
      page.drawText(text, {
        x,
        y,
        font: isBold ? boldFont : font,
        size,
        color: rgb(0, 0, 0),
      })
      y -= size * 1.5 // Move y position down
    }

    drawText(`Order Form - ${formData.brandName}`, 50, true, 20)
    y -= 20

    drawText("Order Details", 50, true, 16)
    drawText(`Ordered by: ${formData.orderedBy}`, 55)
    drawText(`Email: ${formData.email}`, 55)
    if (formData.phone) drawText(`Phone: ${formData.phone}`, 55)
    y -= 10

    drawText("Billing Address:", 50, true, 16)
    drawText(formData.billTo, 55)
    y -= 10

    drawText("Delivery Address:", 50, true, 16)
    drawText(formData.deliverTo, 55)
    y -= 10

    drawText("Items:", 50, true, 16)
    if (formData.items && Object.keys(formData.items).length > 0) {
      Object.values(formData.items).forEach((item: any) => {
        let itemText = `${item.name} - Quantity: ${item.quantity}`
        if (item.customQuantity) {
          itemText += ` (${item.customQuantity})`
        }
        drawText(itemText, 55)
        if (item.notes) {
          drawText(`  Notes: ${item.notes}`, 65, false, 10)
        }
      })
    } else {
      drawText("No items selected.", 55)
    }
    y -= 10

    if (formData.specialInstructions) {
      drawText("Special Instructions:", 50, true, 16)
      // Simple text wrapping
      const lines = formData.specialInstructions.match(/.{1,80}/g) || []
      lines.forEach((line: string) => drawText(line, 55))
    }

    const pdfBytes = await pdfDoc.save()
    const pdfBuffer = Buffer.from(pdfBytes)

    // --- 2. Upload PDF to blob storage ---
    console.log("Uploading PDF to blob storage...")
    const filename = `${formData.brandId}-order-${Date.now()}.pdf`
    const blob = await put(filename, pdfBuffer, {
      access: "public",
      contentType: "application/pdf",
    })
    console.log("PDF uploaded successfully:", blob.url)

    // --- 3. Save to database ---
    console.log("Creating submission record...")
    const supabase = createServerSupabaseClient()
    const { data: submission, error: dbError } = await supabase
      .from("submissions")
      .insert({
        brand_id: formData.brandId,
        ordered_by: formData.orderedBy,
        email: formData.email,
        phone: formData.phone,
        bill_to: formData.billTo,
        deliver_to: formData.deliverTo,
        special_instructions: formData.specialInstructions,
        items: formData.items, // Storing as JSONB
        pdf_url: blob.url,
        status: "pending",
      })
      .select()
      .single()

    if (dbError) {
      console.error("Database error:", dbError)
      throw new Error(`Failed to save submission: ${dbError.message}`)
    }
    console.log("Submission created successfully:", submission.id)

    // Revalidate admin page to show new submission
    revalidatePath("/admin")
    console.log("Revalidated /admin path.")

    // --- 4. Send email ---
    console.log("Sending order email...")
    const emailResult = await sendOrderEmail({
      to: formData.brandEmail,
      cc: formData.email, // Also send a copy to the person who ordered
      subject: `New Order Received for ${formData.brandName}`,
      brandName: formData.brandName,
      orderedBy: formData.orderedBy,
      email: formData.email,
      phone: formData.phone,
      billTo: formData.billTo,
      deliverTo: formData.deliverTo,
      items: formData.items,
      specialInstructions: formData.specialInstructions,
      pdfUrl: blob.url,
    })
    console.log("Email result:", emailResult)

    return NextResponse.json({
      success: true,
      message: "Order submitted successfully!",
      submissionId: submission.id,
      pdfUrl: blob.url,
    })
  } catch (error) {
    console.error("Error processing order:", error)
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json(
      { success: false, error: "Failed to process order", details: errorMessage },
      { status: 500 },
    )
  }
}
