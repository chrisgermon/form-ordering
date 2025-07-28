import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { sendOrderEmail } from "@/lib/email"
import { put } from "@vercel/blob"
import { revalidatePath } from "next/cache"
import { PDFDocument, rgb, StandardFonts } from "pdf-lib"

export async function POST(request: NextRequest) {
  // 1. Environment Variable Check: Fail fast if configuration is missing.
  const requiredEnvVars = [
    "SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "BLOB_READ_WRITE_TOKEN",
    "MAILGUN_SMTP_HOST",
    "MAILGUN_SMTP_PORT",
    "MAILGUN_SMTP_USERNAME",
    "MAILGUN_SMTP_PASSWORD",
    "FROM_EMAIL",
  ]
  const missingEnvVars = requiredEnvVars.filter((v) => !process.env[v])
  if (missingEnvVars.length > 0) {
    const message = `Missing critical environment variables on the server: ${missingEnvVars.join(", ")}`
    console.error(message)
    return NextResponse.json({ success: false, error: "Server Configuration Error", details: message }, { status: 500 })
  }

  try {
    const formData = await request.json()
    console.log("Processing order for brand:", formData.brandName)

    if (!formData.brandId || !formData.orderedBy || !formData.email || !formData.billTo || !formData.deliverTo) {
      return NextResponse.json(
        { success: false, error: "Validation Error", details: "Missing required fields." },
        { status: 400 },
      )
    }

    // 2. PDF Generation
    let pdfBuffer: Buffer
    try {
      console.log("Step 1: Generating PDF...")
      const pdfDoc = await PDFDocument.create()
      let page = pdfDoc.addPage()
      const { height } = page.getSize()
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
      let y = height - 50

      const drawText = (text: string, x: number, isBold = false, size = 12) => {
        if (y < 50) {
          page = pdfDoc.addPage()
          y = page.getHeight() - 50
        }
        page.drawText(text, { x, y, font: isBold ? boldFont : font, size, color: rgb(0, 0, 0) })
        y -= size * 1.5
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
          const itemText = `${item.name} - Quantity: ${item.quantity === "other" ? item.customQuantity : item.quantity}`
          drawText(itemText, 55)
        })
      } else {
        drawText("No items selected.", 55)
      }
      y -= 10
      if (formData.specialInstructions) {
        drawText("Special Instructions:", 50, true, 16)
        const lines = formData.specialInstructions.match(/.{1,80}/g) || []
        lines.forEach((line: string) => drawText(line, 55))
      }

      const pdfBytes = await pdfDoc.save()
      pdfBuffer = Buffer.from(pdfBytes)
      console.log("PDF generated successfully.")
    } catch (error) {
      console.error("PDF Generation Error:", error)
      throw new Error("Failed to generate PDF for the order.")
    }

    // 3. Blob Storage Upload
    let blobUrl: string
    try {
      console.log("Step 2: Uploading PDF to blob storage...")
      const filename = `${formData.brandId}-order-${Date.now()}.pdf`
      const blob = await put(filename, pdfBuffer, { access: "public", contentType: "application/pdf" })
      blobUrl = blob.url
      console.log("PDF uploaded successfully:", blobUrl)
    } catch (error) {
      console.error("Blob Upload Error:", error)
      throw new Error("Failed to upload order PDF.")
    }

    // 4. Database Insertion
    let submissionId: string
    try {
      console.log("Step 3: Saving submission to database...")
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
          items: formData.items,
          pdf_url: blobUrl,
          status: "pending",
        })
        .select("id")
        .single()

      if (dbError) throw dbError
      submissionId = submission.id
      console.log("Submission created successfully:", submissionId)
    } catch (error) {
      console.error("Database Insertion Error:", error)
      throw new Error(`Failed to save submission to database: ${(error as Error).message}`)
    }

    revalidatePath("/admin")
    console.log("Revalidated /admin path.")

    // 5. Email Sending
    try {
      console.log("Step 4: Sending order email...")
      await sendOrderEmail({
        to: formData.brandEmail,
        cc: formData.email,
        subject: `New Order Received for ${formData.brandName}`,
        brandName: formData.brandName,
        orderedBy: formData.orderedBy,
        email: formData.email,
        phone: formData.phone,
        billTo: formData.billTo,
        deliverTo: formData.deliverTo,
        items: formData.items,
        specialInstructions: formData.specialInstructions,
        pdfBuffer: pdfBuffer,
        pdfUrl: blobUrl,
      })
      console.log("Email sent successfully.")
    } catch (error) {
      console.error("Email Sending Error:", error)
      // Log the error but don't fail the request, as the order is already saved.
    }

    return NextResponse.json({
      success: true,
      message: "Order submitted successfully!",
      submissionId: submissionId,
      pdfUrl: blobUrl,
    })
  } catch (error) {
    console.error("[API_SUBMIT_ORDER_ERROR]", error)
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json(
      { success: false, error: "Failed to process order.", details: errorMessage },
      { status: 500 },
    )
  }
}
